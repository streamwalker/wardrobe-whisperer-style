import Foundation
import CoreGraphics

/// Largest unobstructed rectangle, preferring the leading/top region on ties.
func usableFrame(in bounds: CGRect, avoiding reserved: CGRect) -> CGRect {
    let gap = bounds.intersection(reserved)
    guard !gap.isNull, gap.width > 0, gap.height > 0 else { return bounds }
    let candidates = [
        CGRect(x: bounds.minX, y: bounds.minY, width: gap.minX - bounds.minX, height: bounds.height),
        CGRect(x: gap.maxX, y: bounds.minY, width: bounds.maxX - gap.maxX, height: bounds.height),
        CGRect(x: bounds.minX, y: bounds.minY, width: bounds.width, height: gap.minY - bounds.minY),
        CGRect(x: bounds.minX, y: gap.maxY, width: bounds.width, height: bounds.maxY - gap.maxY)
    ]
    return candidates.reduce(CGRect.zero) { best, next in
        next.width * next.height > best.width * best.height ? next : best
    }
}
