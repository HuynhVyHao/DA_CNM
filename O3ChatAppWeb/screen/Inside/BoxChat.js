import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Keyboard,
} from "react-native";
import { DynamoDB } from "aws-sdk";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";

const BoxChat = ({ navigation, route }) => {
  const { friend, user } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const dynamoDB = new DynamoDB.DocumentClient({
    region: REGION,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  });

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      }
    );

    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    // fetchMessages();
    const interval = setInterval(fetchMessages, 500); // Gọi fetch tin nhắn mỗi 1 giây
    return () => clearInterval(interval); // Xóa interval khi component unmount
  }, []);

  const fetchMessages = async () => {
    try {
      const senderParams = {
        TableName: "BoxChats",
        Key: {
          senderSoDienThoai: `${user.soDienThoai}_${friend.soDienThoai}`,
        },
      };
      const senderResponse = await dynamoDB.get(senderParams).promise();
      const senderMessages = senderResponse.Item
        ? senderResponse.Item.messages
        : [];

      setMessages(senderMessages);
      scrollToBottom(); // Cuộn đến cuối khi tải tin nhắn ban đầu
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") {
      return;
    }

    const timestamp = new Date().toISOString();

    const senderMessage = {
      content: newMessage,
      senderSoDienThoai: `${user.soDienThoai}_${friend.soDienThoai}`,
      receiverSoDienThoai: friend.soDienThoai,
      timestamp: timestamp,
      isSender: true,
    };

    const receiverMessage = {
      content: newMessage,
      senderSoDienThoai: `${friend.soDienThoai}_${user.soDienThoai}`,
      receiverSoDienThoai: user.soDienThoai,
      timestamp: timestamp,
      isSender: false,
    };

    try {
      const senderParams = {
        TableName: "BoxChats",
        Key: {
          senderSoDienThoai: `${user.soDienThoai}_${friend.soDienThoai}`,
        },
        UpdateExpression: "SET messages = list_append(messages, :newMessage)",
        ExpressionAttributeValues: {
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(senderParams).promise();

      const receiverParams = {
        TableName: "BoxChats",
        Key: {
          senderSoDienThoai: `${friend.soDienThoai}_${user.soDienThoai}`,
        },
        UpdateExpression: "SET messages = list_append(messages, :newMessage)",
        ExpressionAttributeValues: {
          ":newMessage": [receiverMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(receiverParams).promise();

      setMessages([...messages, senderMessage]);
      setNewMessage("");
      scrollToBottom(); // Cuộn đến cuối sau khi gửi tin nhắn
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatMessageTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${formattedHours}:${formattedMinutes}`;
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        scrollToBottom();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <Pressable style={styles.btnBack} onPress={() => navigation.goBack()}>
          <Text style={styles.txtBack}>Quay lại</Text>
        </Pressable>
        <Text style={styles.headerText}>{friend.hoTen}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        ref={scrollViewRef}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              {
                alignSelf: message.isSender ? "flex-end" : "flex-start",
                backgroundColor: message.isSender ? "#94e5f2" : "#dddddd",
              },
            ]}
          >
            <Text style={styles.messageText}>{message.content}</Text>
            <Text style={styles.messageTimestamp}>
              {formatMessageTimestamp(message.timestamp)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputBox}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Nhập tin nhắn"
          ref={textInputRef}
        />
        <Pressable style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Gửi</Text>
        </Pressable>
      </View>
      
    </View>
  );
};

export default BoxChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection:"row",
    justifyContent:"space-around",
    alignItems: "center",
    backgroundColor: "#4AD8C7",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#fff",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inputBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000",
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    width: 50,
    height: 40,
    backgroundColor: "lightblue",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  messageTimestamp: {
    fontSize: 12,
    color: "gray",
  },
  btnBack: {
    position: 'absolute',

    top: 5,
    left: 20,
    padding: 10,
  },
  txtBack: {
    color: '#FFF',
    fontSize: 16,
  },
});