import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import firebase from 'firebase/compat/app';
import { firebaseConfig } from '../LoginASignUp/firebaseConfig';
import { DynamoDB } from 'aws-sdk';
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";

const ForgotPasswordScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const recaptchaVerifier = React.useRef(null);

  // Initialize AWS DynamoDB DocumentClient
  const dynamoDB = new DynamoDB.DocumentClient({
    region: REGION,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  });

  const sendOTP = async () => {
    const phoneProvider = new firebase.auth.PhoneAuthProvider();
    try {
      const verificationId = await phoneProvider.verifyPhoneNumber(
        '+84' + phoneNumber.slice(1),
        recaptchaVerifier.current
      );
      if (verificationId) {
        setVerificationId(verificationId);
        alert(
          'Thông báo !Mã OTP đã được gửi thành công!',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };

  const confirmOTPAndChangePassword = async () => {
    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(
        verificationId,
        otp
      );
      await firebase.auth().signInWithCredential(credential);
      
      // Update password in DynamoDB
      await updatePassword(phoneNumber, newPassword);

      Alert.alert(
        'Thông báo',
        'Cập nhật mật khẩu thành công!',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false }
      );

    } catch (error) {
      console.error('Error confirming OTP and changing password:', error);
      alert(
        'Lỗi!Mã OTP không đúng!',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false }
      );
    }
  };

  const updatePassword = async (phoneNumber, newPassword) => {
    const params = {
      TableName: 'Users',
      Key: {
        soDienThoai: phoneNumber,
      },
      UpdateExpression: 'set matKhau = :password',
      ExpressionAttributeValues: {
        ':password': newPassword,
      },
      ReturnValues: 'ALL_NEW', // Optional, nếu bạn muốn nhận lại các giá trị đã cập nhật
    };

    try {
      const updatedUser = await dynamoDB.update(params).promise();
      console.log('Updated user:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        title="Xác thực"
        cancelLabel="Hủy"
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Quên mật khẩu</Text>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>Nhập số điện thoại của bạn để nhận mã xác nhận</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: 'gray', padding: 10, borderRadius: 5, marginBottom: 20, width: 250 }}
        placeholder="Số điện thoại"
        onChangeText={(text) => setPhoneNumber(text)}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        style={{ backgroundColor: 'blue', padding: 10, borderRadius: 5 }}
        onPress={sendOTP}
      >
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>Gửi OTP</Text>
      </TouchableOpacity>

      {/* Thêm phần nhập mã OTP và mật khẩu mới */}
      <TextInput
        style={{ borderWidth: 1, borderColor: 'gray', padding: 10, borderRadius: 5, marginBottom: 20, width: 250 }}
        placeholder="Mã OTP"
        onChangeText={(text) => setOTP(text)}
        keyboardType="number-pad"
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: 'gray', padding: 10, borderRadius: 5, marginBottom: 20, width: 250 }}
        placeholder="Mật khẩu mới"
        onChangeText={(text) => setNewPassword(text)}
        secureTextEntry={true}
      />

      <TouchableOpacity
        style={{ backgroundColor: 'blue', padding: 10, borderRadius: 5 }}
        onPress={confirmOTPAndChangePassword}
      >
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>Xác nhận</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => {
          navigation.navigate('LoginForm');
        }}
      >
        <Text style={{ color: 'blue', textDecorationLine: 'underline', fontSize: 16 }}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordScreen;
