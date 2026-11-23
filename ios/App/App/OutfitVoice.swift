import Foundation
import Capacitor
import AppIntents

private struct SpokenOutfit: Codable {
    let account: String
    var text: String?
    var expires: Date?
}

/// Only an explicitly selected outfit is stored. No session tokens or photos.
private enum VoiceStore {
    static var url: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("spoken-outfit.json")
    }
    static func read() -> SpokenOutfit? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(SpokenOutfit.self, from: data)
    }
    static func write(_ value: SpokenOutfit?) throws {
        guard let value else {
            if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
            return
        }
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(value).write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        var file = url
        var resources = URLResourceValues()
        resources.isExcludedFromBackup = true
        try file.setResourceValues(resources)
    }
}

@objc(OutfitVoicePlugin)
public final class OutfitVoicePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OutfitVoicePlugin"
    public let jsName = "OutfitVoice"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setAccount", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "selectOutfit", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearOutfit", returnType: CAPPluginReturnPromise)
    ]

    @objc func setAccount(_ call: CAPPluginCall) {
        do {
            let account = call.getString("account")
            if account != VoiceStore.read()?.account {
                try VoiceStore.write(account.map { SpokenOutfit(account: $0) })
            }
            call.resolve()
        } catch { call.reject("Could not update Siri selection.") }
    }

    @objc func selectOutfit(_ call: CAPPluginCall) {
        guard let account = call.getString("account"), !account.isEmpty,
              let text = call.getString("text"), !text.isEmpty, text.count <= 1500,
              VoiceStore.read()?.account == account else {
            call.reject("Sign in again before selecting an outfit for Siri.")
            return
        }
        do {
            try VoiceStore.write(SpokenOutfit(account: account, text: text, expires: Date().addingTimeInterval(86400)))
            call.resolve()
        } catch { call.reject("Could not save the outfit for Siri.") }
    }

    @objc func clearOutfit(_ call: CAPPluginCall) {
        do {
            if let account = VoiceStore.read()?.account { try VoiceStore.write(SpokenOutfit(account: account)) }
            call.resolve()
        } catch { call.reject("Could not clear the outfit for Siri.") }
    }
}

@available(iOS 16.0, *)
struct ReadSelectedOutfit: AppIntent {
    static var title: LocalizedStringResource = "Read my outfit"
    static var description = IntentDescription("Read the outfit you chose for Siri in Drip Slayer during the last 24 hours.")
    static var openAppWhenRun = false

    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let text: String
        if let outfit = VoiceStore.read(), let selection = outfit.text,
           let expires = outfit.expires, expires > Date() {
            text = selection
        } else {
            text = "Open Drip Slayer on your iPhone, go to Your outfits, and choose Use with Siri on a saved outfit. Your selection lasts for 24 hours."
        }
        return .result(value: text, dialog: IntentDialog(stringLiteral: text))
    }
}

@available(iOS 16.0, *)
struct DripSlayerShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: ReadSelectedOutfit(), phrases: [
            "Read my outfit in \(.applicationName)",
            "What am I wearing with \(.applicationName)"
        ], shortTitle: "Read my outfit", systemImageName: "tshirt")
    }
}
