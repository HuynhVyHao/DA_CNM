import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Pressable,
  ScrollView,
  TextInput,
  Keyboard,
  Image,
} from "react-native";
import { DynamoDB, S3 } from "aws-sdk";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


const BoxChat = ({ friend,user }) => {
  
  //const { friend, user } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false); // Thêm state để theo dõi việc cuộn lên

  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.cancelled) {
        setSelectedImage(result.uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "" && !selectedImage) {
      return;
    }

    const timestamp = new Date().toISOString();

    let senderMessage = null;
    let receiverMessage = null;

    if (newMessage.trim() !== "") {
      senderMessage = {
        content: newMessage,
        senderSoDienThoai: `${user.soDienThoai}_${friend.soDienThoai}`,
        receiverSoDienThoai: friend.soDienThoai,
        timestamp: timestamp,
        isSender: true,
      };

      receiverMessage = {
        content: newMessage,
        senderSoDienThoai: `${friend.soDienThoai}_${user.soDienThoai}`,
        receiverSoDienThoai: user.soDienThoai,
        timestamp: timestamp,
        isSender: false,
      };
    }

    if (selectedImage) {
      const imageUrl = await uploadImageToS3(selectedImage);
      if (imageUrl) {
        senderMessage = {
          content: imageUrl,
          senderSoDienThoai: `${user.soDienThoai}_${friend.soDienThoai}`,
          receiverSoDienThoai: friend.soDienThoai,
          timestamp: timestamp,
          isSender: true,
        };

        receiverMessage = {
          content: imageUrl,
          senderSoDienThoai: `${friend.soDienThoai}_${user.soDienThoai}`,
          receiverSoDienThoai: user.soDienThoai,
          timestamp: timestamp,
          isSender: false,
        };
      } else {
        console.error("Error uploading image to S3");
        return;
      }
    }

    try {
      if (senderMessage) {
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
      }

      if (receiverMessage) {
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
      }

      setMessages([...messages, senderMessage]);
      setNewMessage("");
      setSelectedImage(null);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const dynamoDB = new DynamoDB.DocumentClient({
    region: REGION,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  });

  

  useEffect(() => {
    const interval = setInterval(fetchMessages, 500);
    return () => clearInterval(interval);
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
      //scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentOffset = contentOffset.y;
    const maxOffset = contentSize.height - layoutMeasurement.height;
  
    setIsScrolledUp(currentOffset < maxOffset - 50); // Cập nhật trạng thái cuộn lên/xuống
  
    // Kiểm tra nếu đang cuộn đến đáy và có tin nhắn mới được thêm vào, thì mới gọi hàm scrollToEnd()
    if (currentOffset >= maxOffset - 10 && messages.length > 0) {
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages, isScrolledUp]);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
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
      Bucket: "haoiuh",
      Key: "avatar_" + new Date().getTime() + ".jpg",
      Body: blob,
      ContentType: "image/jpeg/jfif/png/gif",
    };

    try {
      const data = await s3.upload(params).promise();
      return data.Location; // Return image URL
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: friend.avatarUrl }} style={styles.headerImg} />
        <Text style={styles.headerText}>{friend.hoTen}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        ref={scrollViewRef}
        onScroll={handleScroll} // Xử lý sự kiện scroll
        scrollEventThrottle={16}
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
    {typeof message.content === 'string' && message.content.startsWith('http') ? (
      <Image source={{ uri: message.content }} style={styles.messageImage} />
    ) : (
      <Text style={styles.messageText}>{message.content}</Text>
    )}
    {typeof message.content === 'string' && (
      <Text style={styles.messageTimestamp}>
        {formatMessageTimestamp(message.timestamp)}
      </Text>
    )}
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
        <Pressable style={styles.sendImageButton} onPress={selectImage}>
          <FontAwesome name="camera" size={24} color="white" />
        </Pressable>
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <Pressable onPress={removeSelectedImage} style={styles.removeImageButton}>
              <FontAwesome name="times-circle" size={20} color="red" />
            </Pressable>
          </View>
        )}
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
  headerImg:{
    borderRadius:20,
    width:50,
    height:50
  },
  sendImageButton: {
    width: 40,
    height: 40,
    backgroundColor: "lightgreen",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  imagePreviewContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start", // Để các phần tử nằm bên trái
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
  selectedImage: {
    width: 100,
    height: 100,
    marginVertical: 5,
    borderRadius: 10,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});
