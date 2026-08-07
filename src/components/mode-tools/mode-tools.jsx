import classNames from 'classnames';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import {changeBrushSize} from '../../reducers/brush-mode';
import {changeBrushSize as changeEraserSize} from '../../reducers/eraser-mode';
import {changeBitBrushSize} from '../../reducers/bit-brush-size';
import {changeBitEraserSize} from '../../reducers/bit-eraser-size';
import {setShapesFilled} from '../../reducers/fill-bitmap-shapes';

import FontDropdown from '../../containers/font-dropdown.jsx';
import LiveInputHOC from '../forms/live-input-hoc.jsx';
import Label from '../forms/label.jsx';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import Input from '../forms/input.jsx';
import InputGroup from '../input-group/input-group.jsx';
import LabeledIconButton from '../labeled-icon-button/labeled-icon-button.jsx';
import Modes from '../../lib/modes';
import Formats, {isBitmap, isVector} from '../../lib/format';
import {hideLabel} from '../../lib/hide-label';
import styles from './mode-tools.css';

import copyIcon from '!../../tw-recolor/build!./icons/copy.svg';
import pasteIcon from '!../../tw-recolor/build!./icons/paste.svg';
import deleteIcon from '!../../tw-recolor/build!./icons/delete.svg';

import bitBrushIcon from '../bit-brush-mode/brush.svg';
import bitEraserIcon from '../bit-eraser-mode/eraser.svg';
import bitLineIcon from '../bit-line-mode/line.svg';
import brushIcon from '../brush-mode/brush.svg';
import curvedPointIcon from '!../../tw-recolor/build!./icons/curved-point.svg';
import eraserIcon from '../eraser-mode/eraser.svg';
import flipHorizontalIcon from '!../../tw-recolor/build!./icons/flip-horizontal.svg';
import flipVerticalIcon from '!../../tw-recolor/build!./icons/flip-vertical.svg';
import straightPointIcon from '!../../tw-recolor/build!./icons/straight-point.svg';
import bitOvalIcon from '../bit-oval-mode/oval.svg';
import bitRectIcon from '../bit-rect-mode/rectangle.svg';
import bitOvalOutlinedIcon from '../bit-oval-mode/oval-outlined.svg';
import bitRectOutlinedIcon from '../bit-rect-mode/rectangle-outlined.svg';

import {MAX_STROKE_WIDTH} from '../../reducers/stroke-width';

import RoundedRectTypeDropdown from '../rounded-rect-type-dropdown/rounded-rect-type-dropdown.jsx';

const LiveInput = LiveInputHOC(Input);

class RoundedRectParams extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            roundMode: 'uniform',
            uniformRadius: 20,
            cornerRadii: [20, 20, 20, 20]
        };
        this.handleModeChange = this.handleModeChange.bind(this);
        this.handleUniformRadiusChange = this.handleUniformRadiusChange.bind(this);
        this.handleCornerRadiusChange = this.handleCornerRadiusChange.bind(this);
        this.notifyRadiusChange = this.notifyRadiusChange.bind(this);
    }

    componentDidMount() {
        // 组件挂载时传递初始圆角值
        this.notifyRadiusChange([20, 20, 20, 20]);
    }

    // 统一通知父组件圆角变化
    notifyRadiusChange(radii) {
        // 确保 radii 是包含4个数字的数组
        const validRadii = radii.map(r => {
            const num = Number(r);
            return isNaN(num) ? 0 : Math.max(0, Math.round(num));
        });
        this.props.onDrawRoundedRect(validRadii);
    }

    handleModeChange (e) {
        const mode = e.target.value;
        let newRadii;
        if (mode === 'uniform') {
            newRadii = [this.state.uniformRadius, this.state.uniformRadius, 
                       this.state.uniformRadius, this.state.uniformRadius];
        } else {
            newRadii = this.state.cornerRadii.slice();
        }
        this.setState({
            roundMode: mode,
            cornerRadii: newRadii
        });
        this.notifyRadiusChange(newRadii);
    }

    handleUniformRadiusChange (e) {
        const value = Number(e.target.value);
        const clampedValue = isNaN(value) ? 0 : Math.max(0, Math.round(value));
        const radii = [clampedValue, clampedValue, clampedValue, clampedValue];
        this.setState({
            uniformRadius: clampedValue,
            cornerRadii: radii
        });
        this.notifyRadiusChange(radii);
    }

    handleCornerRadiusChange (index, e) {
        const value = Number(e.target.value);
        const clampedValue = isNaN(value) ? 0 : Math.max(0, Math.round(value));
        const cornerRadii = this.state.cornerRadii.slice();
        cornerRadii[index] = clampedValue;
        this.setState({cornerRadii});
        this.notifyRadiusChange(cornerRadii);
    }

    render () {
        const { intl } = this.props;
        return (
            <div className={styles.modeTools}>
                <InputGroup className={styles.modLabeledIconHeight}>
                    <Label text={intl.formatMessage({ id: 'paint.roundedRect.cornerType', defaultMessage: 'Type' })}>
                        <select 
                            value={this.state.roundMode} 
                            onChange={this.handleModeChange}
                            className={styles.select}
                        >
                            <option value="uniform">
                                {intl.formatMessage({ id: 'paint.roundedRect.uniform', defaultMessage: 'Uniform' })}
                            </option>
                            <option value="four">
                                {intl.formatMessage({ id: 'paint.roundedRect.fourCorners', defaultMessage: 'Separate' })}
                            </option>
                        </select>
                    </Label>
                </InputGroup>
                {this.state.roundMode === 'uniform' ? (
                    <InputGroup className={styles.modLabeledIconHeight}>
                        <Label text={intl.formatMessage({ id: 'paint.roundedRect.radius', defaultMessage: 'Corner Radius' })}>
                            <Input
                                range
                                small
                                type="number"
                                min="0"
                                max="200"
                                value={String(this.state.uniformRadius)}
                                onChange={this.handleUniformRadiusChange}
                            />
                        </Label>
                    </InputGroup>
                ) : (
                    <div className={styles.modeTools}>
                        {[
                            { id: 'tl', label: intl.formatMessage({ id: 'paint.roundedRect.topLeft', defaultMessage: 'topleft' }) },
                            { id: 'tr', label: intl.formatMessage({ id: 'paint.roundedRect.topRight', defaultMessage: 'topright' }) },
                            { id: 'br', label: intl.formatMessage({ id: 'paint.roundedRect.bottomRight', defaultMessage: 'bottomright' }) },
                            { id: 'bl', label: intl.formatMessage({ id: 'paint.roundedRect.bottomLeft', defaultMessage: 'bottomleft' }) }
                        ].map((corner, index) => (
                            <InputGroup className={styles.modLabeledIconHeight} key={corner.id}>
                                <Label text={corner.label}>
                                    <Input
                                        range
                                        small
                                        type="number"
                                        min="0"
                                        max="200"
                                        value={String(this.state.cornerRadii[index] || 0)}
                                        onChange={e => this.handleCornerRadiusChange(index, e)}
                                    />
                                </Label>
                            </InputGroup>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

const ModeToolsComponent = props => {
    const messages = defineMessages({
        brushSize: {
            defaultMessage: 'Size',
            description: 'Label for the brush size input',
            id: 'paint.modeTools.brushSize'
        },
        eraserSize: {
            defaultMessage: 'Eraser size',
            description: 'Label for the eraser size input',
            id: 'paint.modeTools.eraserSize'
        },
        copy: {
            defaultMessage: 'Copy',
            description: 'Label for the copy button',
            id: 'paint.modeTools.copy'
        },
        paste: {
            defaultMessage: 'Paste',
            description: 'Label for the paste button',
            id: 'paint.modeTools.paste'
        },
        delete: {
            defaultMessage: 'Delete',
            description: 'Label for the delete button',
            id: 'paint.modeTools.delete'
        },
        curved: {
            defaultMessage: 'Curved',
            description: 'Label for the button that converts selected points to curves',
            id: 'paint.modeTools.curved'
        },
        pointed: {
            defaultMessage: 'Pointed',
            description: 'Label for the button that converts selected points to sharp points',
            id: 'paint.modeTools.pointed'
        },
        thickness: {
            defaultMessage: 'Thickness',
            description: 'Label for the number input to choose the line thickness',
            id: 'paint.modeTools.thickness'
        },
        flipHorizontal: {
            defaultMessage: 'Flip Horizontal',
            description: 'Label for the button to flip the image horizontally',
            id: 'paint.modeTools.flipHorizontal'
        },
        flipVertical: {
            defaultMessage: 'Flip Vertical',
            description: 'Label for the button to flip the image vertically',
            id: 'paint.modeTools.flipVertical'
        },
        filled: {
            defaultMessage: 'Filled',
            description: 'Label for the button that sets the bitmap rectangle/oval mode to draw outlines',
            id: 'paint.modeTools.filled'
        },
        outlined: {
            defaultMessage: 'Outlined',
            description: 'Label for the button that sets the bitmap rectangle/oval mode to draw filled-in shapes',
            id: 'paint.modeTools.outlined'
        },
        Type: {
            id: 'paint.roundedRect.cornerType',
            description: 'Label for the dropdown that selects corner type',
            defaultMessage: 'Type'
        },
        Uniform: {
            id: 'paint.roundedRect.uniform',
            description: 'Option for uniform corner radius mode',
            defaultMessage: 'Uniform'
        },
        Separate: {
            id: 'paint.roundedRect.fourCorners',
            description: 'Option for four separate corner radius mode',
            defaultMessage: 'Separate'
        },
        CornerRadius: {
            id: 'paint.roundedRect.radius',
            description: 'Label for the input to set uniform corner radius',
            defaultMessage: 'Corner Radius'
        },
        topleft: {
            id: 'paint.roundedRect.topLeft',
            description: 'Label for the input to set top-left corner radius',
            defaultMessage: 'top-left'
        },
        topright: {
            id: 'paint.roundedRect.topRight',
            description: 'Label for the input to set top-right corner radius',
            defaultMessage: 'top-right'
        },
        bottomright: {
            id: 'paint.roundedRect.bottomRight',
            description: 'Label for the input to set bottom-right corner radius',
            defaultMessage: 'bottom-right'
        },
        bottomleft: {
            id: 'paint.roundedRect.bottomLeft',
            description: 'Label for the input to set bottom-left corner radius',
            defaultMessage: 'bottom-left'
        }
    });

    switch (props.mode) {
    case Modes.BRUSH:
        /* falls through */
    case Modes.BIT_BRUSH:
        /* falls through */
    case Modes.BIT_LINE:
    {
        const currentIcon = isVector(props.format) ? brushIcon :
            props.mode === Modes.BIT_LINE ? bitLineIcon : bitBrushIcon;
        const currentBrushValue = isBitmap(props.format) ? props.bitBrushSize : props.brushValue;
        const changeFunction = isBitmap(props.format) ? props.onBitBrushSliderChange : props.onBrushSliderChange;
        const currentMessage = props.mode === Modes.BIT_LINE ? messages.thickness : messages.brushSize;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <div>
                    <img
                        alt={props.intl.formatMessage(currentMessage)}
                        className={styles.modeToolsIcon}
                        draggable={false}
                        src={currentIcon}
                    />
                </div>
                <LiveInput
                    range
                    small
                    max={MAX_STROKE_WIDTH}
                    min="1"
                    type="number"
                    value={currentBrushValue}
                    onSubmit={changeFunction}
                />
            </div>
        );
    }
    case Modes.BIT_ERASER:
        /* falls through */
    case Modes.ERASER:
    {
        const currentIcon = isVector(props.format) ? eraserIcon : bitEraserIcon;
        const currentEraserValue = isBitmap(props.format) ? props.bitEraserSize : props.eraserValue;
        const changeFunction = isBitmap(props.format) ? props.onBitEraserSliderChange : props.onEraserSliderChange;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <div>
                    <img
                        alt={props.intl.formatMessage(messages.eraserSize)}
                        className={styles.modeToolsIcon}
                        draggable={false}
                        src={currentIcon}
                    />
                </div>
                <LiveInput
                    range
                    small
                    max={MAX_STROKE_WIDTH}
                    min="1"
                    type="number"
                    value={currentEraserValue}
                    onSubmit={changeFunction}
                />
            </div>
        );
    }
    case Modes.RESHAPE:
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <InputGroup className={classNames(styles.modDashedBorder, styles.modLabeledIconHeight)}>
                    <LabeledIconButton
                        disabled={!props.hasSelectedUncurvedPoints}
                        hideLabel={hideLabel(props.intl.locale)}
                        imgSrc={curvedPointIcon}
                        title={props.intl.formatMessage(messages.curved)}
                        onClick={props.onCurvePoints}
                    />
                    <LabeledIconButton
                        disabled={!props.hasSelectedUnpointedPoints}
                        hideLabel={hideLabel(props.intl.locale)}
                        imgSrc={straightPointIcon}
                        title={props.intl.formatMessage(messages.pointed)}
                        onClick={props.onPointPoints}
                    />
                </InputGroup>
                <InputGroup className={classNames(styles.modLabeledIconHeight)}>
                    <LabeledIconButton
                        hideLabel={hideLabel(props.intl.locale)}
                        imgSrc={deleteIcon}
                        title={props.intl.formatMessage(messages.delete)}
                        onClick={props.onDelete}
                    />
                </InputGroup>
            </div>
        );
    case Modes.BIT_SELECT:
        /* falls through */
    case Modes.SELECT:
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <InputGroup className={classNames(styles.modDashedBorder, styles.modLabeledIconHeight)}>
                    <LabeledIconButton
                        hideLabel={hideLabel(props.intl.locale)}
                        imgSrc={copyIcon}
                        title={props.intl.formatMessage(messages.copy)}
                        onClick={props.onCopyToClipboard}
                    />
                    <LabeledIconButton
                        disabled={!(props.clipboardItems.length > 0)}
                        hideLabel={hideLabel(props.intl.locale)}
                        imgSrc={pasteIcon}
                        title={props.intl.formatMessage(messages.paste)}
                        onClick={props.onPasteFromClipboard}
                    />
                </InputGroup>
                <InputGroup className={classNames(styles.modDashedBorder, styles.modLabeledIconHeight)}>
                    <LabeledIconButton
                        hideLabel={hideLabel(props.intl.locale)}
                        imgSrc={deleteIcon}
                        title={props.intl.formatMessage(messages.delete)}
                        onClick={props.onDelete}
                    />
                </InputGroup>
                <InputGroup className={classNames(styles.modLabeledIconHeight)}>
                    <LabeledIconButton
                        hideLabel={props.intl.locale !== 'en'}
                        imgSrc={flipHorizontalIcon}
                        title={props.intl.formatMessage(messages.flipHorizontal)}
                        onClick={props.onFlipHorizontal}
                    />
                    <LabeledIconButton
                        hideLabel={props.intl.locale !== 'en'}
                        imgSrc={flipVerticalIcon}
                        title={props.intl.formatMessage(messages.flipVertical)}
                        onClick={props.onFlipVertical}
                    />
                </InputGroup>
            </div>
        );
    case Modes.BIT_TEXT:
        /* falls through */
    case Modes.TEXT:
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <InputGroup>
                    <FontDropdown
                        onUpdateImage={props.onUpdateImage}
                        onManageFonts={props.onManageFonts}
                    />
                </InputGroup>
            </div>
        );
    case Modes.BIT_RECT:
        return (
            <div className={classNames(props.className, styles.modeTools)}>
            </div>
        );

        /* falls through */
    case Modes.ROUNDED_RECT:
    return (
        <div className={classNames(props.className, styles.modeTools)}>
            <RoundedRectTypeDropdown
                onCornerRadiiChange={props.onDrawRoundedRect}
            />
        </div>
    );
    case Modes.BIT_OVAL:
    {
        const fillIcon = props.mode === Modes.BIT_RECT ? bitRectIcon : bitOvalIcon;
        const outlineIcon = props.mode === Modes.BIT_RECT ? bitRectOutlinedIcon : bitOvalOutlinedIcon;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <InputGroup>
                    <LabeledIconButton
                        highlighted={props.fillBitmapShapes}
                        imgSrc={fillIcon}
                        title={props.intl.formatMessage(messages.filled)}
                        onClick={props.onFillShapes}
                        gray
                    />
                </InputGroup>
                <InputGroup>
                    <LabeledIconButton
                        highlighted={!props.fillBitmapShapes}
                        imgSrc={outlineIcon}
                        title={props.intl.formatMessage(messages.outlined)}
                        onClick={props.onOutlineShapes}
                        gray
                    />
                </InputGroup>
                {props.fillBitmapShapes ? null : (
                    <InputGroup>
                        <Label text={props.intl.formatMessage(messages.thickness)}>
                            <LiveInput
                                range
                                small
                                max={MAX_STROKE_WIDTH}
                                min="1"
                                type="number"
                                value={props.bitBrushSize}
                                onSubmit={props.onBitBrushSliderChange}
                            />
                        </Label>
                    </InputGroup>)
                }
            </div>
        );
    }
    
    default:
        // Leave empty for now, if mode not supported
        return (
            <div className={classNames(props.className, styles.modeTools)} />
        );
    }
};

ModeToolsComponent.propTypes = {
    bitBrushSize: PropTypes.number,
    bitEraserSize: PropTypes.number,
    brushValue: PropTypes.number,
    className: PropTypes.string,
    clipboardItems: PropTypes.arrayOf(PropTypes.array),
    eraserValue: PropTypes.number,
    fillBitmapShapes: PropTypes.bool,
    format: PropTypes.oneOf(Object.keys(Formats)),
    hasSelectedUncurvedPoints: PropTypes.bool,
    hasSelectedUnpointedPoints: PropTypes.bool,
    intl: intlShape.isRequired,
    mode: PropTypes.string.isRequired,
    onBitBrushSliderChange: PropTypes.func.isRequired,
    onBitEraserSliderChange: PropTypes.func.isRequired,
    onBrushSliderChange: PropTypes.func.isRequired,
    onCopyToClipboard: PropTypes.func.isRequired,
    onCurvePoints: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEraserSliderChange: PropTypes.func,
    onFillShapes: PropTypes.func.isRequired,
    onFlipHorizontal: PropTypes.func.isRequired,
    onFlipVertical: PropTypes.func.isRequired,
    onDrawRoundedRect: PropTypes.func.isRequired,
    onManageFonts: PropTypes.func,
    onOutlineShapes: PropTypes.func.isRequired,
    onPasteFromClipboard: PropTypes.func.isRequired,
    onPointPoints: PropTypes.func.isRequired,
    onUpdateImage: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    mode: state.scratchPaint.mode,
    format: state.scratchPaint.format,
    fillBitmapShapes: state.scratchPaint.fillBitmapShapes,
    bitBrushSize: state.scratchPaint.bitBrushSize,
    bitEraserSize: state.scratchPaint.bitEraserSize,
    brushValue: state.scratchPaint.brushMode.brushSize,
    clipboardItems: state.scratchPaint.clipboard.items,
    eraserValue: state.scratchPaint.eraserMode.brushSize
});
const mapDispatchToProps = dispatch => ({
    onBrushSliderChange: brushSize => {
        dispatch(changeBrushSize(brushSize));
    },
    onBitBrushSliderChange: bitBrushSize => {
        dispatch(changeBitBrushSize(bitBrushSize));
    },
    onBitEraserSliderChange: eraserSize => {
        dispatch(changeBitEraserSize(eraserSize));
    },
    onEraserSliderChange: eraserSize => {
        dispatch(changeEraserSize(eraserSize));
    },
    onFillShapes: () => {
        dispatch(setShapesFilled(true));
    },
    onOutlineShapes: () => {
        dispatch(setShapesFilled(false));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(injectIntl(ModeToolsComponent));
