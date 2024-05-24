import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import AWS from "aws-sdk";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";
import { useFonts } from "expo-font";
// Configure AWS
AWS.config.update({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: REGION,
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const PhoneAuthScreen = ({ route, navigation }) => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const { email, hoTen, matKhau, imageUrl, newPassword } = route.params;
  const inputs = useRef([]);

  const handleChange = (index) => (value) => {
    if (isNaN(value)) return;
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);
    if (index < otp.length - 1 && value !== "") {
      // Di chuyển focus tới ô tiếp theo nếu không phải là ô cuối cùng và giá trị mới không rỗng
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress =
    (index) =>
    ({ nativeEvent }) => {
      if (nativeEvent.key === "Backspace") {
        const updatedOtp = [...otp];
        updatedOtp[index] = ""; // Xóa dữ liệu của ô hiện tại
        setOtp(updatedOtp);
        if (index > 0) {
          // Di chuyển focus tới ô trước đó nếu index không phải là ô đầu tiên
          inputs.current[index - 1].focus();
        }
      }
    };

  const handleVerify = async () => {
    try {
      const otpCode = otp.join("");
      const response = await fetch("http://192.168.1.41:3000/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Xác thực thành công
        if (newPassword) {
          // Nếu có newPassword, đây là việc cập nhật mật khẩu
          updatePassword();
        } else {
          // Nếu không có newPassword, đây là việc đăng ký tài khoản mới
          completeSignUp();
        }
      } else {
        alert("Xác thực OTP không thành công");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Xác thực OTP không thành công");
    }
  };

  const updatePassword = async () => {
    try {
      const updateParams = {
        TableName: "Users",
        Key: { email },
        UpdateExpression: "SET matKhau = :newPassword",
        ExpressionAttributeValues: {
          ":newPassword": newPassword,
        },
      };

      await dynamodb.update(updateParams).promise();

      Alert.alert("Thành công", "Mật khẩu mới đã được cập nhật thành công");
      navigation.navigate("LoginForm");
    } catch (error) {
      console.error("Lỗi khi cập nhật mật khẩu mới:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật mật khẩu mới");
    }
  };

  const completeSignUp = async () => {
    try {
      // Lưu thông tin người dùng vào DynamoDB
      const paramsDynamoDb = {
        TableName: "Users", // Tên bảng Users
        Item: {
          email: email,
          hoTen: hoTen,
          matKhau: matKhau,
          avatarUser: imageUrl,
        },
      };

      await dynamodb.put(paramsDynamoDb).promise();
      alert("Đăng ký thành công");
      navigation.navigate("LoginForm");
    } catch (error) {
      console.error("Error saving user data to DynamoDB:", error);
      alert("Đăng ký thất bại");
    }
  };
  const [fontsLoaded] = useFonts({
    "Teko-VariableFont": require("../../assets/fonts/Teko-VariableFont.ttf"),
  });
  if (!fontsLoaded) {
    return null;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.titleHeader}>Xác Thực</Text>
      <Text style={styles.titleContent}>
        Mã xác thực đã được gửi tới email của bạn
      </Text>
      <Text style={{ marginBottom: 20, fontWeight: 400 }}>
        Email của bạn: {email}
      </Text>
      <Text style={styles.title}>Nhập mã OTP</Text>
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            onChangeText={handleChange(index)}
            onKeyPress={handleKeyPress(index)}
            value={digit}
          />
        ))}
      </View>
      <Pressable onPress={handleVerify} style={styles.btnVerify}>
        <Text style={styles.txtVerify}>Xác thực</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  titleHeader: {
    marginTop: 100,
    fontSize: 50,
    color: "#000",
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "Teko-VariableFont",
  },
  titleContent: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    fontFamily: "Teko-VariableFont",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: "#333",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 5,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  btnVerify: {
    width: 200,
    height: 50,
    borderRadius: 13,
    backgroundColor: "rgba(117, 40, 215, 0.47)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  txtVerify: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default PhoneAuthScreen;
