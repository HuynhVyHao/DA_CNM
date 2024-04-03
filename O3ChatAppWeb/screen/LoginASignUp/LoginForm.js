import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DynamoDB } from "aws-sdk";
import { useFonts } from "expo-font";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";

const SignUpForm = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../../assets/fonts/KeaniaOne-Regular.ttf"),
  });

  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [nhapLaiMatKhau, setNhapLaiMatKhau] = useState("");

  const signUp = async () => {
    try {
      if (!hoTen || !soDienThoai || !matKhau || !nhapLaiMatKhau) {
        alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
        return;
      }

      if (matKhau !== nhapLaiMatKhau) {
        alert("Lỗi", "Mật khẩu nhập lại không khớp");
        return;
      }

      const dynamoDB = new DynamoDB.DocumentClient({
        region: REGION,
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      });

      const params = {
        TableName: "Users",
        Item: {
          soDienThoai: soDienThoai,
          hoTen: hoTen,
          matKhau: matKhau,
        },
      };

      await dynamoDB.put(params).promise();
      alert("Thông báo", "Đăng ký thành công");
      // Sau khi đăng ký thành công, có thể chuyển hướng đến màn hình đăng nhập
      // navigation.navigate("LoginScreen");
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      alert("Lỗi", "Đăng ký thất bại");
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#4AD8C7", "#B728A9"]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.txtLogo}>4MChat</Text>
        </View>
        <Text style={styles.title}>Đăng ký</Text>
        <TextInput
          style={styles.input}
          placeholder="Họ và Tên"
          onChangeText={(text) => setHoTen(text)}
          value={hoTen}
        />
        <TextInput
          style={styles.input}
          placeholder="Số điện thoại"
          onChangeText={(text) => setSoDienThoai(text)}
          value={soDienThoai}
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          secureTextEntry={true}
          onChangeText={(text) => setMatKhau(text)}
          value={matKhau}
        />
        <TextInput
          style={styles.input}
          placeholder="Nhập lại mật khẩu"
          secureTextEntry={true}
          onChangeText={(text) => setNhapLaiMatKhau(text)}
          value={nhapLaiMatKhau}
        />
        <Pressable style={styles.button} onPress={signUp}>
          <Text style={styles.buttonText}>Đăng Ký</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 48,
  },
  title: {
    color: "#F5EEEE",
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#000",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
    marginBottom: 20,
  },
  button: {
    width: 200,
    height: 50,
    borderRadius: 13,
    backgroundColor: "rgba(117, 40, 215, 0.47)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default SignUpForm;
