import React from 'react';
import { Button } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface BigButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  variant?: 'solid' | 'outline';
  size?: 'normal' | 'small' | 'large';
  disabled?: boolean;
  block?: boolean;
  className?: string;
}

const BigButton: React.FC<BigButtonProps> = ({
  text,
  onClick,
  type = 'primary',
  variant = 'solid',
  size = 'normal',
  disabled = false,
  block = false,
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <Button
      className={classNames(
        styles.bigButton,
        styles[type],
        variant === 'outline' && styles.outline,
        size === 'small' && styles.small,
        size === 'large' && styles.large,
        block && styles.block,
        disabled && styles.disabled,
        className
      )}
      onClick={handleClick}
    >
      {text}
    </Button>
  );
};

export default BigButton;
