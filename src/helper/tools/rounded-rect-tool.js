import paper from '@turbowarp/paper';
import Modes from '../../lib/modes';
import {styleShape} from '../style-path';
import {clearSelection} from '../selection';
import {getSquareDimensions} from '../math';
import BoundingBoxTool from '../selection-tools/bounding-box-tool';
import NudgeTool from '../selection-tools/nudge-tool';

const clampRadius = (radius, rect) => {
    const maxRadius = Math.min(Math.abs(rect.width), Math.abs(rect.height)) / 2;
    return Math.max(0, Math.min(radius, maxRadius));
};

/**
 * 创建圆角矩形的路径
 * @param {paper.Rectangle} rect - 矩形区域
 * @param {Array<number>} cornerRadii - 四个角的半径 [左上, 右上, 右下, 左下]
 * @returns {paper.Path} 圆角矩形路径
 */
const createRoundedRectangle = (rect, cornerRadii) => {
    const [rTL, rTR, rBR, rBL] = cornerRadii.map(r => clampRadius(r, rect));
    
    const left = rect.x;
    const top = rect.y;
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;

    const path = new paper.Path();

    // 从左上角开始
    path.moveTo(new paper.Point(left + rTL, top));

    // 右上角 - 使用 quadraticCurveTo
    if (rTR > 0) {
        path.lineTo(new paper.Point(right - rTR, top));
        // 二次贝塞尔曲线：控制点为角点，终点为下一个边的起点
        path.quadraticCurveTo(
            new paper.Point(right, top),           // 控制点（角点）
            new paper.Point(right, top + rTR)      // 终点
        );
    } else {
        path.lineTo(new paper.Point(right, top));
    }

    // 右下角
    if (rBR > 0) {
        path.lineTo(new paper.Point(right, bottom - rBR));
        path.quadraticCurveTo(
            new paper.Point(right, bottom),        // 控制点（角点）
            new paper.Point(right - rBR, bottom)   // 终点
        );
    } else {
        path.lineTo(new paper.Point(right, bottom));
    }

    // 左下角
    if (rBL > 0) {
        path.lineTo(new paper.Point(left + rBL, bottom));
        path.quadraticCurveTo(
            new paper.Point(left, bottom),         // 控制点（角点）
            new paper.Point(left, bottom - rBL)    // 终点
        );
    } else {
        path.lineTo(new paper.Point(left, bottom));
    }

    // 左上角
    if (rTL > 0) {
        path.lineTo(new paper.Point(left, top + rTL));
        path.quadraticCurveTo(
            new paper.Point(left, top),            // 控制点（角点）
            new paper.Point(left + rTL, top)       // 终点
        );
    } else {
        path.lineTo(new paper.Point(left, top));
    }

    path.closePath();
    return path;
};
/**
 * Tool for drawing rounded rectangles.
 */
class RoundedRectTool extends paper.Tool {
    static get TOLERANCE () {
        return 2;
    }
    /**
     * @param {function} setSelectedItems Callback to set the set of selected items in the Redux state
     * @param {function} clearSelectedItems Callback to clear the set of selected items in the Redux state
     * @param {function} setCursor Callback to set the visible mouse cursor
     * @param {!function} onUpdateImage A callback to call when the image visibly changes
     */
    constructor (setSelectedItems, clearSelectedItems, setCursor, onUpdateImage) {
        super();
        this.setSelectedItems = setSelectedItems;
        this.clearSelectedItems = clearSelectedItems;
        this.onUpdateImage = onUpdateImage;
        this.boundingBoxTool = new BoundingBoxTool(
            Modes.ROUNDED_RECT,
            setSelectedItems,
            clearSelectedItems,
            setCursor,
            onUpdateImage
        );
        const nudgeTool = new NudgeTool(Modes.ROUNDED_RECT, this.boundingBoxTool, onUpdateImage);

        // We have to set these functions instead of just declaring them because
        // paper.js tools hook up the listeners in the setter functions.
        this.onMouseDown = this.handleMouseDown;
        this.onMouseDrag = this.handleMouseDrag;
        this.onMouseMove = this.handleMouseMove;
        this.onMouseUp = this.handleMouseUp;
        this.onKeyUp = nudgeTool.onKeyUp;
        this.onKeyDown = nudgeTool.onKeyDown;

        this.roundedRect = null;
        this.colorState = null;
        this.cornerRadii = [20, 20, 20, 20];
        this.isBoundingBoxMode = null;
        this.active = false;
    }
    
    getHitOptions () {
        return {
            segments: true,
            stroke: true,
            curves: true,
            fill: true,
            guide: false,
            match: hitResult =>
                (hitResult.item.data && (hitResult.item.data.isScaleHandle || hitResult.item.data.isRotHandle)) ||
                hitResult.item.selected,
            tolerance: RoundedRectTool.TOLERANCE / paper.view.zoom
        };
    }
    
    /**
     * Should be called if the selection changes to update the bounds of the bounding box.
     * @param {Array<paper.Item>} selectedItems Array of selected items.
     */
    onSelectionChanged (selectedItems) {
        this.boundingBoxTool.onSelectionChanged(selectedItems);
    }
    
    setColorState (colorState) {
        this.colorState = colorState;
    }
    
    setCornerRadii (cornerRadii) {
        if (Array.isArray(cornerRadii) && cornerRadii.length === 4) {
            // 确保所有值都是有效数字
            const validRadii = cornerRadii.map(r => {
                const num = Number(r);
                return isNaN(num) ? 0 : Math.max(0, num);
            });
            this.cornerRadii = validRadii;
        }
    }
    
    handleMouseDown (event) {
        if (event.event.button > 0) return; // only first mouse button
        this.active = true;

        if (this.boundingBoxTool.onMouseDown(
            event, false /* clone */, false /* multiselect */, false /* doubleClicked */, this.getHitOptions())) {
            this.isBoundingBoxMode = true;
        } else {
            this.isBoundingBoxMode = false;
            clearSelection(this.clearSelectedItems);
        }
    }
    
    handleMouseDrag (event) {
        if (event.event.button > 0 || !this.active) return; // only first mouse button

        if (this.isBoundingBoxMode) {
            this.boundingBoxTool.onMouseDrag(event);
            return;
        }

        if (this.roundedRect) {
            this.roundedRect.remove();
        }

        // 计算矩形区域
        let rect = new paper.Rectangle(event.downPoint, event.point);
        
        // 处理 Shift 键（正方形）
        if (event.modifiers.shift) {
            const squareDimensions = getSquareDimensions(event.downPoint, event.point);
            rect.size = squareDimensions.size.abs();
            rect.position = squareDimensions.position;
        }
        
        // 处理 Alt 键（中心绘制）
        if (event.modifiers.alt) {
            const size = rect.size.clone();
            rect = new paper.Rectangle(
                event.downPoint.x - size.width / 2,
                event.downPoint.y - size.height / 2,
                size.width,
                size.height
            );
        }

        // 确保矩形有正尺寸
        if (rect.width < 0) {
            rect.x += rect.width;
            rect.width = Math.abs(rect.width);
        }
        if (rect.height < 0) {
            rect.y += rect.height;
            rect.height = Math.abs(rect.height);
        }

        // 防止零尺寸矩形
        if (rect.width < 1 || rect.height < 1) {
            return;
        }

        this.roundedRect = createRoundedRectangle(rect, this.cornerRadii);
        styleShape(this.roundedRect, this.colorState);
    }
    
    handleMouseMove (event) {
        this.boundingBoxTool.onMouseMove(event, this.getHitOptions());
    }
    
    handleMouseUp (event) {
        if (event.event.button > 0 || !this.active) return; // only first mouse button

        if (this.isBoundingBoxMode) {
            this.boundingBoxTool.onMouseUp(event);
            this.isBoundingBoxMode = null;
            return;
        }

        if (this.roundedRect) {
            // 检查矩形是否足够大
            const area = Math.abs(this.roundedRect.area);
            if (area < RoundedRectTool.TOLERANCE / paper.view.zoom) {
                this.roundedRect.remove();
                this.roundedRect = null;
            } else {
                this.roundedRect.selected = true;
                this.setSelectedItems();
                this.onUpdateImage();
                this.roundedRect = null;
            }
        }
        this.active = false;
    }
    
    deactivateTool () {
        this.boundingBoxTool.deactivateTool();
    }
}

export default RoundedRectTool;
