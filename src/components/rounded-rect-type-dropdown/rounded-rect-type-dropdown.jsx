import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';

import Button from '../button/button.jsx';
import Dropdown from '../dropdown/dropdown.jsx';
import InputGroup from '../input-group/input-group.jsx';
import Input from '../forms/input.jsx';
import Label from '../forms/label.jsx';

import styles from './rounded-rect-type-dropdown.css';

class RoundedRectParams extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roundMode: 'uniform',
            uniformRadius: 20,
            cornerRadii: [20, 20, 20, 20],
            isDropdownOpen: false
        };
        
        this.handleModeSelect = this.handleModeSelect.bind(this);
        this.handleUniformRadiusChange = this.handleUniformRadiusChange.bind(this);
        this.handleCornerRadiusChange = this.handleCornerRadiusChange.bind(this);
        this.handleDropdownToggle = this.handleDropdownToggle.bind(this);
        this.notifyRadiusChange = this.notifyRadiusChange.bind(this);
    }

    componentDidMount() {
        this.notifyRadiusChange([20, 20, 20, 20]);
    }

    notifyRadiusChange(radii) {
        const validRadii = radii.map(r => {
            const num = Number(r);
            return isNaN(num) ? 0 : Math.max(0, Math.round(num));
        });
        this.props.onCornerRadiiChange(validRadii);
    }

    handleModeSelect(mode) {
        this.setState({ roundMode: mode, isDropdownOpen: false });
        let newRadii;
        if (mode === 'uniform') {
            newRadii = [this.state.uniformRadius, this.state.uniformRadius, 
                       this.state.uniformRadius, this.state.uniformRadius];
        } else {
            newRadii = this.state.cornerRadii.slice();
        }
        this.notifyRadiusChange(newRadii);
    }

    handleDropdownToggle() {
        this.setState(prevState => ({
            isDropdownOpen: !prevState.isDropdownOpen
        }));
    }

    handleUniformRadiusChange(e) {
        const value = Number(e.target.value);
        const clampedValue = isNaN(value) ? 0 : Math.max(0, Math.round(value));
        const radii = [clampedValue, clampedValue, clampedValue, clampedValue];
        this.setState({
            uniformRadius: clampedValue,
            cornerRadii: radii
        });
        this.notifyRadiusChange(radii);
    }

    handleCornerRadiusChange(index, e) {
        const value = Number(e.target.value);
        const clampedValue = isNaN(value) ? 0 : Math.max(0, Math.round(value));
        const cornerRadii = this.state.cornerRadii.slice();
        cornerRadii[index] = clampedValue;
        this.setState({ cornerRadii });
        this.notifyRadiusChange(cornerRadii);
    }

    render() {
        const { intl } = this.props;
        const { roundMode, uniformRadius, cornerRadii } = this.state;

        // 获取当前选中的模式显示名称
        const getCurrentModeLabel = () => {
            if (roundMode === 'uniform') {
                return intl ? intl.formatMessage({
                    id: 'paint.roundedRect.uniform',
                    defaultMessage: 'Uniform'
                }) : 'Uniform';
            } else {
                return intl ? intl.formatMessage({
                    id: 'paint.roundedRect.fourCorners',
                    defaultMessage: 'Separated'
                }) : 'Separated';
            }
        };

        const dropdownContent = (
            <InputGroup className={styles.menuGroup}>
                <Button
                    className={classNames(styles.menuItem, {
                        [styles.selected]: roundMode === 'uniform'
                    })}
                    onClick={() => this.handleModeSelect('uniform')}
                >
                    {intl ? intl.formatMessage({
                        id: 'paint.roundedRect.uniform',
                        defaultMessage: 'Uniform'
                    }) : 'Uniform'}
                </Button>
                <Button 
                    className={classNames(styles.menuItem, {
                        [styles.selected]: roundMode === 'separated'
                    })}
                    onClick={() => this.handleModeSelect('separated')}
                >
                    {intl ? intl.formatMessage({
                        id: 'paint.roundedRect.fourCorners',
                        defaultMessage: 'Separated'
                    }) : 'Separated'}
                </Button>
            </InputGroup>
        );

        return (
            <div className={styles.roundedRectParams}>
                <Dropdown
                    className={styles.modeDropdown}
                    enterExitTransitionDurationMs={60}
                    popoverContent={dropdownContent}
                    tipSize={0.01}
                    onOpen={this.handleDropdownToggle}
                    onOuterAction={this.handleDropdownToggle}
                >
                    <span className={styles.currentModeLabel}>
                        {getCurrentModeLabel()}
                    </span>
                </Dropdown>

                {roundMode === 'uniform' ? (
                    <InputGroup className={styles.radiusInput}>
                        <Label text={intl ? intl.formatMessage({
                            id: 'paint.roundedRect.radius',
                            defaultMessage: 'Radius'
                        }) : 'Radius'}>
                            <Input
                                range
                                small
                                type="number"
                                min="0"
                                max="200"
                                value={String(uniformRadius)}
                                onChange={this.handleUniformRadiusChange}
                            />
                        </Label>
                    </InputGroup>
                ) : (
                    <div className={styles.cornerInputs}>
                        {['tl', 'tr', 'br', 'bl'].map((corner, index) => {
                            const labels = [
                                intl ? intl.formatMessage({
                                    id: 'paint.roundedRect.topLeft',
                                    defaultMessage: 'top-left'
                                }) : 'top-left',
                                intl ? intl.formatMessage({
                                    id: 'paint.roundedRect.topRight',
                                    defaultMessage: 'top-right'
                                }) : 'top-right',
                                intl ? intl.formatMessage({
                                    id: 'paint.roundedRect.bottomRight',
                                    defaultMessage: 'bottom-right'
                                }) : 'bottom-right',
                                intl ? intl.formatMessage({
                                    id: 'paint.roundedRect.bottomLeft',
                                    defaultMessage: 'bottom-left'
                                }) : 'bottom-left'
                            ];
                            return (
                                <InputGroup key={corner} className={styles.cornerInput}>
                                    <Label text={labels[index]}>
                                        <Input
                                            range
                                            small
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={String(cornerRadii[index] || 0)}
                                            onChange={e => this.handleCornerRadiusChange(index, e)}
                                        />
                                    </Label>
                                </InputGroup>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
}

RoundedRectParams.propTypes = {
    onCornerRadiiChange: PropTypes.func.isRequired,
    intl: intlShape
};

export default injectIntl(RoundedRectParams);