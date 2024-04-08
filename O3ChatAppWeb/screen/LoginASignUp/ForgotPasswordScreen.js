import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Import Auth instance from firebaseConfig

const ForgotPasswordScreen = () => {
  const [soDienThoai, setSoDienThoai] = useState("");

  const sendOTP = async () => {
    try {
      // Khởi tạo RecaptchaVerifier
      const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // Hành động sau khi xác thực thành công
        }
      });

      // Bắt đầu quy trình xác thực số điện thoại và gửi mã OTP
      const phoneNumber = `+84${soDienThoai}`;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

      Alert.alert('Yêu cầu đã được gửi', 'Vui lòng kiểm tra số điện thoại của bạn để nhận mã OTP');
    } catch (error) {
      console.error('Lỗi khi gửi mã OTP:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi gửi mã OTP');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Số điện thoại"
        value={soDienThoai}
        onChangeText={setSoDienThoai}
        keyboardType="phone-pad"
      />
      <Button title="Gửi mã OTP" onPress={sendOTP} />
      {/* Container để chứa RecaptchaVerifier */}
      <View id="recaptcha-container"></View>
    </View>
  );
};

export default ForgotPasswordScreen;
