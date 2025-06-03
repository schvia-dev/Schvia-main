import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface SlideToConfirmProps {
  label?: string;
  width?: any;
  height?: number;
  onConfirmed: () => void;
  autoReset?: boolean;
  resetDelay?: number;
  disabled?: boolean;       // Controls visual and functional disabling
  disableSlide?: boolean;   // Specifically disables sliding interaction
}

const SlideToConfirmButton: React.FC<SlideToConfirmProps> = ({
  label = 'Slide To Confirm',
  width = 300,
  height = 60,
  onConfirmed,
  autoReset = true,
  resetDelay = 3000,
  disabled = false,
  disableSlide = false,
}) => {
  const { colors } = useTheme();
  const [confirmed, setConfirmed] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [containerWidth, setContainerWidth] = useState(width);

  const translateX = useRef(new Animated.Value(0)).current;
  const maxSlide = containerWidth - height;

  const isInteractionDisabled = disabled || disableSlide;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !confirmed && !isInteractionDisabled,
      onPanResponderGrant: () => setSliding(true),
      onPanResponderMove: (_, gesture) => {
        if (!confirmed && !isInteractionDisabled) {
          const dx = Math.max(0, Math.min(gesture.dx, maxSlide));
          translateX.setValue(dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        setSliding(false);
        if (gesture.dx >= maxSlide * 0.9) {
          Animated.timing(translateX, {
            toValue: maxSlide,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setConfirmed(true);
            onConfirmed();

            if (autoReset) {
              setTimeout(() => {
                setConfirmed(false);
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: false,
                }).start();
              }, resetDelay);
            }
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const backgroundColor = disabled
    ? colors.SlideToConfirmButtoncolors.disabledContainer || '#ccc'
    : confirmed
    ? colors.SlideToConfirmButtoncolors.containerconfirm
    : colors.SlideToConfirmButtoncolors.conatiner;

  const handleColor = disabled
    ? colors.SlideToConfirmButtoncolors.disabledCircle || '#999'
    : confirmed
    ? colors.SlideToConfirmButtoncolors.circleconfirm
    : colors.SlideToConfirmButtoncolors.circle;

  const displayLabel = disabled
    ? 'Disabled'
    : confirmed
    ? 'Confirmed!'
    : sliding
    ? 'Release'
    : label;

  return (
    <View
      style={[
        styles.container,
        { width, height, backgroundColor, opacity: isInteractionDisabled ? 0.6 : 1 },
      ]}
      onLayout={onLayout}
    >
      <Text
        style={[
          styles.label,
          {
            color: confirmed
              ? colors.SlideToConfirmButtoncolors.textconfirm
              : colors.SlideToConfirmButtoncolors.text,
          },
        ]}
      >
        {displayLabel}
      </Text>

      <Animated.View
        {...(!isInteractionDisabled ? panResponder.panHandlers : {})}
        style={[
          styles.handle,
          {
            width: height,
            height,
            backgroundColor: handleColor,
            transform: [{ translateX }],
            opacity: isInteractionDisabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.arrow,
            {
              color: confirmed
                ? colors.present
                : colors.SlideToConfirmButtoncolors.mark || colors.primary,
            },
          ]}
        >
          {confirmed ? '✓' : '➤'}
        </Text>
      </Animated.View>
    </View>
  );
};

export default SlideToConfirmButton;

const styles = StyleSheet.create({
  container: {
    borderRadius: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    zIndex: 0,
  },
  handle: {
    borderRadius: 100,
    position: 'absolute',
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  arrow: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});
