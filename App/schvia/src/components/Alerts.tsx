import React from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RFValue } from "react-native-responsive-fontsize";

interface AlertProps {
  visible: boolean;
  heading: string;
  description: string;
  onClose: () => void;
}

const BaseAlert: React.FC<
  AlertProps & { imageSource: any; buttonColor: string; buttonText: string }
> = ({ visible, heading, description, onClose, imageSource, buttonColor, buttonText }) => {
  const { colors } = useTheme();
  console.log(visible);
  console.log("entered in to alert return statement");
  return (
    
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.white }]}>
        
          <Image
            source={imageSource}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={[styles.heading, { color: colors.text.primary }]}>{heading}</Text>
          <Text style={[styles.description, { color: colors.text.secondary }]}>{description}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const SuccessAlert: React.FC<AlertProps> = (props) => {
  const { colors } = useTheme();
  return (
    <BaseAlert
      {...props}
      imageSource={require('../assets/success.gif')}
      buttonColor={colors.primary}
      buttonText="Continue"
    />
  );
};

export const ErrorAlert: React.FC<AlertProps> = (props) => {
    console.log("entered in to alert error function statement");
  const { colors } = useTheme();
  return (
    <BaseAlert
      {...props}
      imageSource={require('../assets/error.gif')} 
      buttonColor={colors.absent}
      buttonText="Try Again"
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  heading: {
    fontSize: Math.min(RFValue(20),20),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontSize: Math.min(RFValue(14),14),
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
