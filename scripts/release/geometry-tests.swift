import Foundation
import CoreGraphics

@main struct GeometryChecks {
    static func main() {
        let canvas = CGRect(x: 20, y: 10, width: 800, height: 600)
        assert(usableFrame(in: canvas, avoiding: .zero) == canvas)
        assert(usableFrame(in: canvas, avoiding: CGRect(x: 900, y: 0, width: 20, height: 600)) == canvas)
        let vertical = usableFrame(in: canvas, avoiding: CGRect(x: 410, y: 0, width: 20, height: 1000))
        assert(vertical == CGRect(x: 20, y: 10, width: 390, height: 600))
        let horizontal = usableFrame(in: canvas, avoiding: CGRect(x: 0, y: 300, width: 1000, height: 20))
        assert(horizontal == CGRect(x: 20, y: 10, width: 800, height: 290))
        let camera = CGRect(x: 760, y: 10, width: 60, height: 80)
        let visible = usableFrame(in: canvas, avoiding: camera)
        assert(!visible.intersects(camera))
        assert(canvas.contains(visible))
        print("6 native safe-region assertions passed")
    }
}
