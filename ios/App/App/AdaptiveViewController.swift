import UIKit
import Capacitor

/// Keep a single web session while the window resizes, rotates, or folds.
final class AdaptiveViewController: UIViewController {
    private let content = DripBridgeViewController()

    override func loadView() { view = AdaptiveSurface() }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.06, green: 0.06, blue: 0.07, alpha: 1)
        addChild(content)
        view.addSubview(content.view)
        content.didMove(toParent: self)
        (view as? AdaptiveSurface)?.webSurface = content.view
    }

    override var childForStatusBarStyle: UIViewController? { content }
    override var childForStatusBarHidden: UIViewController? { content }

}

private final class AdaptiveSurface: UIView {
    var webSurface: UIView?
    private var partiallyOpen = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        if #available(iOS 27.1, *) {
            addInteraction(UIHingeInteraction { [weak self] _, update in
                self?.partiallyOpen = update.hinge?.status == .partiallyOpen
                self?.setNeedsLayout()
            })
        }
    }
    required init?(coder: NSCoder) { fatalError("Use init(frame:)") }

    override func layoutSubviews() {
        super.layoutSubviews()
        var frame = safeAreaLayoutGuide.layoutFrame
        if #available(iOS 27.1, *) {
            // Web dialogs do not receive UIKit's automatic fold avoidance.
            // Keep the complete interactive web surface in a usable region while
            // partially folded; use the whole safe area again when laid flat.
            let divisions = reservedRegions(kind: .division)
            let occlusions = reservedRegions(kind: .occlusion)
            for region in (partiallyOpen ? divisions : []) + occlusions {
                frame = usableFrame(in: frame, avoiding: region.frame)
            }
        }
        if webSurface?.frame != frame { webSurface?.frame = frame }
    }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        setNeedsLayout()
    }
}

final class DripBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(OutfitVoicePlugin())
    }
}
