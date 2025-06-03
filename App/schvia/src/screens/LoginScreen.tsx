import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { RFValue } from "react-native-responsive-fontsize";
import { ngrokConfig } from '../ngrokconfig';
import { fetchAndStoreStudentDetails } from '../components/fetchStudentDetails';
import { getStoredStudentDetails } from '../components/getStoredStudentDetails';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert, SuccessAlert } from '../components/Alerts';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Main: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [rollNo, setRollNo] = useState('');
  const registerSlideAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = getstyles(colors);
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseForgotPassword = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowForgotPassword(false);
    });
  };

  const handleForgotPasswordSubmitEmail = () => {
    console.log('Password reset Roll No:', rollNo);
    const payload = {
      rollNo
    };
    
    fetch(`${ngrokConfig.ngrok_URL}/app/studentForgotPassword`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    .then(async response => {
      const text = await response.text();
      console.log('Raw response:', text);
      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON:', data);
        if (data.success) {
          
          
          setAlertHeader('Password has been reset!');
          setSuccessMessage(data.message);
          setShowSuccessAlert(true);
          
        } else {
          // Alert.alert(data.message || 'Login failed. Please try again.');
          setAlertHeader('Password Reset Failed!');
          setErrorMessage(data.message || 'Password Reset. Please try again.');
          setShowErrorAlert(true);
        }
      } catch (err) {
        console.error('JSON parse error:', err);
        // Alert.alert('Invalid server response');
        setAlertHeader('Password Reset Failed!');
        setErrorMessage('Invalid server response.');
        setShowErrorAlert(true);
      }
      handleCloseForgotPassword();
    })
    .catch(error => {
      console.error('Network error during login:', error);
      // Alert.alert('Network error. Please try again later.');
      setAlertHeader('Registration Failed!');
      setErrorMessage('Network error. Please try again later.');
      setShowErrorAlert(true);

    });
    
  };

  const handleSubmit = () => {
    // Here you can add your login logic
    console.log('Login attempt with:', username, password);
    const payload = {
      username,
      password
    };
    console.log('ngrok URL:', ngrokConfig.ngrok_URL);

    fetch(`${ngrokConfig.ngrok_URL}/app/studentlogin`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    .then(async response => {
      const text = await response.text();
      console.log('Raw response:', text);
      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON:', data);
        if (data.success) {
          await fetchAndStoreStudentDetails(data.user.id);
          console.log('User details stored successfully');
           // Safe retry loop
          let userdata = null;
          let attempts = 0;
          const MAX_ATTEMPTS = 5;

          while (!userdata && attempts < MAX_ATTEMPTS) {
            userdata = await getStoredStudentDetails();
            attempts++;
            console.log(`Attempt ${attempts}: User data retrieved?`, userdata);
            await new Promise(resolve => setTimeout(resolve, 500)); // wait 200ms between tries
          }
          if (userdata) {
            console.log('User details retrieved in login screen:', userdata);

            await login(userdata.student_id);
          } else {
            // Alert.alert('Could not retrieve user data. Please try again.');
            setAlertHeader('Login Failed!');
            setErrorMessage('Could not retrieve user data. Please try again.');
            setShowErrorAlert(true);
          }
        } else {
          // Alert.alert(data.message || 'Login failed. Please try again.');
          setAlertHeader('Login Failed!');
          setErrorMessage(data.message || 'Login failed. Please try again.');
          setShowErrorAlert(true);
        }
      } catch (err) {
        console.error('JSON parse error:', err);
        // Alert.alert('Invalid server response');
        setAlertHeader('Login Failed!');
        setErrorMessage('Invalid server response.');
        setShowErrorAlert(true);
      }
    })
    .catch(error => {
      console.error('Network error during login:', error);
      // Alert.alert('Network error. Please try again later.');
      setErrorMessage('Network error. Please try again later.');
      setShowErrorAlert(true);

    });
  };

  const handleGoogleLogin = () => {
    // Add Google login logic here
    fetch(`${ngrokConfig.ngrok_URL}/app/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }
    }).then(resp=>{
      console.log(resp.json())
    }).catch(err=>{
      console.log(err)
    });
    console.log('Google login attempt');
  };

  const handleRegister = () => {
    setShowRegister(true);
    Animated.timing(registerSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseRegister = () => {
    Animated.timing(registerSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowRegister(false);
    });
  };

  const handleSubmitRegister = () => {
    console.log('Register attempt with roll no:', rollNo);
    
    const payload = {
      rollNo
    };
    
    fetch(`${ngrokConfig.ngrok_URL}/app/studentRegister`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    .then(async response => {
      const text = await response.text();
      console.log('Raw response:', text);
      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON:', data);
        if (data.success) {
          
          handleCloseRegister();
          setShowSuccessAlert(true);
          setAlertHeader('Registration Success!');
          setSuccessMessage(data.message);
          
        } else {
          // Alert.alert(data.message || 'Login failed. Please try again.');
          setAlertHeader('Registration Failed!');
          setErrorMessage(data.message || 'Registration failed. Please try again.');
          setShowErrorAlert(true);
        }
      } catch (err) {
        console.error('JSON parse error:', err);
        // Alert.alert('Invalid server response');
        setAlertHeader('Registration Failed!');
        setErrorMessage('Invalid server response.');
        setShowErrorAlert(true);
      }
    })
    .catch(error => {
      console.error('Network error during login:', error);
      // Alert.alert('Network error. Please try again later.');
      setAlertHeader('Registration Failed!');
      setErrorMessage('Network error. Please try again later.');
      setShowErrorAlert(true);

    });
    
    handleCloseRegister();
  };

  return (
    <ScrollView 
      style={[styles.scrollContainer]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <Image
        source={require('../assets/loginpage.gif')}
        style={styles.loginImage}
      />
      <Text style={styles.title}>Welcome Back!</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Roll No</Text>
        <TextInput
          style={styles.input}
          placeholder="Roll No"
          placeholderTextColor={colors.text.light}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={colors.text.light}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <FontAwesome5 
              name={showPassword ? 'eye' : 'eye-slash'} 
              size={20} 
              color={colors.text.light}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleSubmit}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleLogin}>
        <FontAwesome5 name="google" size={20} color={colors.text.primary} />
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>New to Application? </Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.registerLink}>Register</Text>
        </TouchableOpacity>
      </View>
      
      <Modal
        visible={showForgotPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseForgotPassword}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={handleCloseForgotPassword}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={handleCloseForgotPassword}>
                <FontAwesome5 name="times" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Roll No</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your Roll No"
                placeholderTextColor={colors.text.light}
                value={rollNo}
                onChangeText={setRollNo}
                autoCapitalize="characters"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleForgotPasswordSubmitEmail}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showRegister}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseRegister}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseRegister}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: registerSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register</Text>
              <TouchableOpacity onPress={handleCloseRegister}>
                <FontAwesome5 name="times" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Roll No</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your Roll No"
                placeholderTextColor={colors.text.light}
                value={rollNo}
                onChangeText={setRollNo}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleSubmitRegister}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
      <ErrorAlert
        visible={showErrorAlert}
        heading={alertHeader}
        description={errorMessage}
        onClose={() => setShowErrorAlert(false)}
      />
      <SuccessAlert
        visible={showSuccessAlert}
        heading={alertHeader}
        description={successMessage}
        onClose={() => setShowSuccessAlert(false)}
      />

      </ScrollView>
      
  );
};

const getstyles = (colors: any) => {
return StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  loginImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: Math.min(RFValue(28),28),
    marginBottom: 20,
    color: colors.primary,
    fontWeight: 'bold',
    resizeMode: 'contain',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: colors.white,
    color: colors.text.primary,
    ...colors.card.shadow,
  },
  loginButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
    color: colors.cardinfo.cardtextcolor,
    ...colors.card.shadow,
  },
  signUpButton: {
    backgroundColor: colors.primaryLight,
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    ...colors.card.shadow,
  },
  buttonText: {
    color: colors.cardinfo.cardtextcolor,
    fontSize: Math.min(RFValue(16),16),
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.primaryLight,
  },
  dividerText: {
    color: colors.text.secondary,
    paddingHorizontal: 10,
    fontSize: Math.min(RFValue(14),14),
  },
  googleButton: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...colors.card.shadow,
  },
  googleButtonText: {
    color: colors.text.primary,
    fontSize: Math.min(RFValue(16),16),
    fontWeight: '600',
    marginLeft: 10,
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 5,
  },
  passwordInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingRight: 50,
    backgroundColor: colors.white,
    color: colors.text.primary,
    ...colors.card.shadow,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 2,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 5,
  },
  label: {
    fontSize: Math.min(RFValue(14),14),
    color: colors.text.primary,
    marginBottom: 2,
    fontWeight: '500',
    paddingLeft: 2,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    color: colors.text.secondary,
    fontSize: Math.min(RFValue(14),14),
  },
  registerLink: {
    color: colors.primary,
    fontSize: Math.min(RFValue(14),14),
    fontWeight: '600',
  },
  
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: Math.min(RFValue(14),14),
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: Math.min(RFValue(20),20),
    fontWeight: 'bold',
    color: colors.text.primary,
  }
});
};

export default LoginScreen;