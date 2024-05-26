import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { DynamoDB } from "aws-sdk";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";

const LoginForm = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../../assets/fonts/KeaniaOne-Regular.ttf"),
  });

  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const handleLogin = async () => {
    try {
      if (!email || !matKhau) {
        alert("Vui lòng điền email và mật khẩu");
        return;
      }

      // Kiểm tra số điện thoại có 10 số và bắt đầu bằng số 0
      if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        alert("Lỗi!Email không hợp lệ");
        return;
      }

      const dynamoDB = new DynamoDB.DocumentClient({
        region: REGION,
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      });

      const params = {
        TableName: "Users",
        Key: {
          email: email,
        },
      };

      const userData = await dynamoDB.get(params).promise();

      if (!userData.Item) {
        // User not found
        alert("Email hoặc mật khẩu không tồn tại");
        return;
      }

      // Check if password matches
      if (userData.Item.matKhau !== matKhau) {
        alert("Mật khẩu không chính xác");
        return;
      }

      // Authentication successful
      navigation.navigate("HomeScreen", { user: userData.Item });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  if (!fontsLoaded) {
    return undefined;
  }
  const handleForgotPassword = () => {
    setModalVisible(true);
  };
  const handleResetPasswordRequest = async () => {
    try {
      if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        alert("Lỗi!Email không hợp lệ");
        return;
      }

      if (!newPassword) {
        alert("Lỗi!Vui lòng nhập mật khẩu mới");
        return;
      }

      const response = await fetch("http://192.168.1.22:3000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log(data);
      if (data.error) {
        alert("Lỗi", data.error);
      } else {
        setResetModalVisible(false);
        navigation.navigate("PhoneAuthScreen", {
          email,
          newPassword,
});
      }
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu đặt lại mật khẩu:", error);
      alert("Lỗi!Đã xảy ra lỗi khi gửi yêu cầu đặt lại mật khẩu");
    }
  };

  return (
    <LinearGradient colors={["#4AD8C7", "#B728A9"]} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.txtLogo}>4MChat</Text>
        </View>

        <TextInput
          style={{ ...styles.inputSdt, color: "#000" }}
          placeholder="Email"
          onChangeText={(text) => setEmail(text)}
          value={email}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={{ ...styles.inputPass, color: "#000" }}
            placeholder="Mật khẩu"
            secureTextEntry={!showPassword}
            onChangeText={(text) => setMatKhau(text)}
            value={matKhau}
          />
          <Pressable
            style={styles.togglePassword}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.togglePasswordText}>
              {showPassword ? "Ẩn" : "Hiện"}
            </Text>
          </Pressable>
        </View>
        <Text
          style={{ color: "#0B0B0B", fontSize: 14, marginTop: 20 }}
          onPress={handleForgotPassword}
        >
          Quên mật khẩu?
        </Text>

        <Pressable onPress={handleLogin} style={styles.btnLogin}>
          <Text style={styles.txtLogin}>Đăng Nhập</Text>
        </Pressable>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập Email</Text>
            <TextInput
              style={styles.inputNewPass}
              placeholder="Email"
              onChangeText={(text) => setEmail(text)}
              value={email}
            />
            <Pressable
              onPress={() => {
                setModalVisible(false);
                setResetModalVisible(true);
              }}
              style={styles.btnResetPass}
            >
              <Text style={styles.txtResetPass}>Gửi yêu cầu đổi mật khẩu</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal View cho Reset Password */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={resetModalVisible}
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập mật khẩu mới</Text>
            <TextInput
              style={styles.inputNewPass}
              placeholder="Mật khẩu mới"
              secureTextEntry
onChangeText={(text) => setNewPassword(text)}
              value={newPassword}
            />
            <Pressable
              onPress={handleResetPasswordRequest}
              style={styles.btnResetPass}
            >
              <Text style={styles.txtResetPass}>Cập nhật mật khẩu</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Pressable style={styles.btnBack} onPress={() => navigation.goBack()}>
        <Text style={styles.txtBack}>Quay lại</Text>
      </Pressable>
    </LinearGradient>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  btnBack: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  btnResetPass: {
    backgroundColor: "lightblue",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  txtResetPass: {
    color: "#000",
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputNewPass: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
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
  inputSdt: {
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#BCB2B2",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
    marginTop: 36,
  },
  inputPass: {
    flex: 1,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#BCB2B2",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    borderRadius: 10,
    paddingLeft: 10,
    marginTop: 36,
  },
  togglePassword: {
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderColor: "#BCB2B2",
  },
  togglePasswordText: {
    color: "#BCB2B2",
  },
  btnLogin: {
    width: 200,
    height: 50,
    borderRadius: 13,
    backgroundColor: "rgba(117, 40, 215, 0.47)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  txtLogin: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});
