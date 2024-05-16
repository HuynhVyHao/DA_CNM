import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DynamoDB, S3 } from "aws-sdk";
import { useFonts } from "expo-font";
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import firebase from 'firebase/compat/app';
import { firebaseConfig } from '../LoginASignUp/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";
import * as ImagePicker from 'expo-image-picker';

const SignUpForm = () => {
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [nhapLaiMatKhau, setNhapLaiMatKhau] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  const [verificationId, setVerificationId] = useState(null);
  const recaptchaVerifier = React.useRef(null);
  const [otp, setOTP] = useState('');
  const dynamoDB = new DynamoDB.DocumentClient({
    region: REGION,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  });
 
  const signUp = async () => {
    try {
      if (soDienThoai.length !== 10 && soDienThoai.length !== 11) {
        alert("Số điện thoại phải có đủ 10 hoặc 11 số");
        return;
      }
      if (/\d/.test(hoTen)) {
        alert("Tên không được chứa số");
        return;
      }
      if (!imageUri) {
        alert("Vui lòng chọn ảnh đại diện");
        return;
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(matKhau)) {
        alert("Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một số");
        return;
      }
      if (matKhau !== nhapLaiMatKhau) {
        alert("Mật khẩu nhập lại không khớp");
        return;
      }
      const credential = firebase.auth.PhoneAuthProvider.credential(
        verificationId,
        otp
      );
      try {
        await firebase.auth().signInWithCredential(credential);
      } catch (error) {
        // Báo lỗi khi mã OTP không đúng
        console.error("Lỗi khi xác thực OTP:", error);
        alert("Mã OTP không đúng");
        return;
      }

      const imageUrl = await uploadImageToS3(imageUri);
      if (!imageUrl) {
        alert("Lỗi khi tải ảnh lên S3");
        return;
      }
      
      const params = {
        TableName: "Users",
        Item: {
          soDienThoai: soDienThoai,
          hoTen: hoTen,
          matKhau: matKhau,
          avatarUrl: imageUrl
        },
      };
      
      await dynamoDB.put(params).promise();
      alert("Đăng ký thành công");
      navigation.navigate('LoginForm');
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      alert("Đăng ký thất bại");
    }
  };
  const checkPhoneNumberExists = async (phoneNumber) => {
    const params = {
      TableName: "Users",
      Key: {
        soDienThoai: phoneNumber,
      },
    };
  
    try {
      const user = await dynamoDB.get(params).promise();
      return user.Item !== undefined; // Trả về true nếu số điện thoại đã tồn tại, ngược lại trả về false
    } catch (error) {
      console.error('Error checking phone number:', error);
      throw error;
    }
  };
  
  const sendOTP = async () => {
    const phoneProvider = new firebase.auth.PhoneAuthProvider();
    try {
      const phoneNumberExists = await checkPhoneNumberExists(soDienThoai);
    
    if (phoneNumberExists) {
      // Số điện thoại đã tồn tại trong DynamoDB, hiển thị thông báo và không gửi mã OTP
      alert('Số điện thoại đã được đăng ký');
      return;
    }
      const verificationId = await phoneProvider.verifyPhoneNumber(
        '+84' + soDienThoai.slice(1),
        recaptchaVerifier.current
      );
      if (verificationId) {
        setVerificationId(verificationId);

        const otpSentTime = new Date().getTime();
        localStorage.setItem('otpSentTime', otpSentTime);
        
        alert(
          'Thông báo !Mã OTP đã được gửi thành công!',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
          { cancelable: false }
        );
      }
    } catch (error) {
      alert("Vui lòng nhập số điện thoại")
      console.error('Error sending OTP:', error);
    }
  };

  const uploadImageToS3 = async (fileUri) => {
    const s3 = new S3({
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
      region: REGION,
    });

    const response = await fetch(fileUri);
    const blob = await response.blob();

    const params = {
      Bucket: "longs3",
      Key: "avatar_" + new Date().getTime() + ".jpg",
      Body: blob,
      ContentType: "image/jpeg/jfif/png/gif",
    };

    try {
      const data = await s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.error("Lỗi khi tải ảnh lên S3:", error);
      return null;
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../../assets/fonts/KeaniaOne-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient colors={["#4AD8C7", "#B728A9"]} style={styles.background}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        title="Xác thực"
        cancelLabel="Hủy"
      />
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.txtLogo}>4MChat</Text>
        </View>
        <Text style={{ color: "#F5EEEE", fontSize: 40, fontWeight: "bold" }}>Đăng ký</Text>
        <View style={styles.imageContainer}>
          <Pressable onPress={pickImage}>
            <Text style={{ paddingVertical: 10, paddingHorizontal: 20, color: '#FFF', marginTop: 15, borderRadius: 30, backgroundColor: "rgba(117, 40, 215, 0.47)" }}>Chọn ảnh</Text>
          </Pressable>
          {imageUri && <Image source={{ uri: imageUri }} style={{ marginLeft: 30, width: 70, height: 70, borderRadius: 30, marginTop: 20 }} />}
        </View>
        <TextInput
          style={{ ...styles.inputHoTen, color: "#000" }}
          placeholder="Họ và Tên"
          onChangeText={(text) => setHoTen(text)}
        />
        <TextInput
          style={{ ...styles.inputSDT, color: "#000" }}
          placeholder="Số điện thoại"
          onChangeText={(text) => setSoDienThoai(text)}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={{ ...styles.inputPass, color: "#000" }}
            placeholder="Mật khẩu"
            secureTextEntry={!showPassword}
            onChangeText={(text) => setMatKhau(text)}
          />
          <Pressable style={styles.showPasswordButton} onPress={toggleShowPassword}>
            <Text style={styles.showPasswordText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
          </Pressable>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={{ ...styles.inputConfirmPass, color: "#000" }}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry={!showConfirmPassword}
            onChangeText={(text) => setNhapLaiMatKhau(text)}
          />
          <Pressable style={styles.showPasswordButton} onPress={toggleShowConfirmPassword}>
            <Text style={styles.showPasswordText}>{showConfirmPassword ? 'Ẩn' : 'Hiện'}</Text>
          </Pressable>
        </View>
        <View style={styles.otp}>
        <TextInput
        style={{ borderWidth: 1, borderColor: 'gray',backgroundColor:"white", padding: 10, borderRadius: 10, marginTop: 10, width: 150 }}
        placeholder="Mã OTP"
        onChangeText={(text) => setOTP(text)}
      />
        <Pressable
        style={{ backgroundColor: 'rgba(117, 40, 215, 0.47)', padding: 10, borderRadius: 10,marginTop:10 ,marginLeft:10}}
        onPress={sendOTP}>
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>Gửi OTP</Text>
      </Pressable>
      </View>
        <Pressable style={styles.btnSignUp} onPress={signUp}>
          <Text style={styles.txtSignUp}>Đăng Ký</Text>
        </Pressable>
        
      </View>
      <Pressable style={styles.btnBack} onPress={() => navigation.goBack()}>
          <Text style={styles.txtBack}>Quay lại</Text>
        </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  otp:{
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnBack: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
  },
  txtBack: {
    color: 'black',
    fontSize: 16,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
  txtLogo: {
    marginTop: 10,
    color: "#fff",
    fontSize: 64,
    fontFamily: "keaniaone-regular",
  },
  logo: {
    width: 243,
    alignItems: "center",
    height: 84,
    borderRadius: 10,
    backgroundColor: "rgba(217, 217, 217, 0.50)",
    marginTop: 20,
  },
  inputHoTen: {
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#BCB2B2",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
    marginTop: 20,
  },
  inputSDT: {
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#BCB2B2",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
    marginTop: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    borderRadius: 10,
    marginTop: 20,
  },
  inputPass: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10,
  },
  inputConfirmPass: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10,
  },
  showPasswordButton: {
    paddingHorizontal: 10,
  },
  showPasswordText: {
    color: '#BCB2B2',
  },
  btnSignUp: {
    width: 200,
    height: 50,
    borderRadius: 13,
    backgroundColor: "rgba(117, 40, 215, 0.47)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  txtSignUp: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default SignUpForm;
