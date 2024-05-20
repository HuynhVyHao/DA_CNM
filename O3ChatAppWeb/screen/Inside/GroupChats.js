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
  Modal
} from "react-native";
import { DynamoDB, S3 } from "aws-sdk";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION ,S3_BUCKET_NAME} from "@env";
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Icon from "react-native-vector-icons/AntDesign";
import * as DocumentPicker from 'expo-document-picker';


const GroupChats = ({user,onClose,group}) => {
    const [boxChatGroupData, setBoxChatGroupData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollViewRef = useRef(null);
    const textInputRef = useRef(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedGroupID, setSelectedGroupID] = useState(null); 

    const s3 = new S3({
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      region: REGION,
    });
  
    const dynamoDB = new DynamoDB.DocumentClient({
      region: REGION,
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    });
  
    const handleClose = () => {
      onClose();
    };
   
    const pickFile = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync();
        console.log(result);
  
        if (!result.canceled) {
          setSelectedFile(result.assets[0]);
          const file = result.assets[0].uri.split(".");
          //const fileType = file[file.length - 1];
          //setFileTypeDoc(fileType); // Lưu thông tin về tệp đã chọn
        }
      } catch (error) {
        console.log("Error picking file:", error);
      }
    };
    const handleFileDownload = async (fileURL, fileName) => {
      try {
        // Tạo một phần tử <a> ẩn để tải xuống tệp
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        // Hiển thị thông báo cho người dùng
        //alert("File đã được tải xuống.");
  
        console.log("File downloaded:", fileName);
      } catch (error) {
        console.error("Download error:", error);
      }
    };
  
    const cancelDoc = () => {
      setSelectedFile(null);
      //setFileTypeDoc("");
    };
    const openModal = (message, index) => {
      setSelectedMessageIndex(index);
      setSelectedMessage(message);
      setIsModalVisible(true);
    };
  
    const closeModal = () => {
      setIsModalVisible(false);
      setSelectedMessage(null);
      setSelectedMessageIndex(null);
    };
    const deleteFileFromStorage = async (filePath) => {
      try {
          const params = {
              Bucket: 'longs3', // Thay thế bằng tên bucket của bạn
              Key: filePath// Đường dẫn đến file trong bucket
          };
          
          // Gửi yêu cầu xóa file tới S3
          await s3.deleteObject(params).promise();
          
          console.log('File deleted successfully');
      } catch (error) {
          console.error('Error deleting file:', error);
          throw error; // Ném lỗi để bắt ở nơi gọi hàm nếu cần
      }
  };
  const deleteMessage = async () => {
      try {
          const messageToDelete = messages[selectedMessageIndex];
          let updatedMessages;
  
          // Kiểm tra loại tin nhắn và xử lý tương ứng
          if (messageToDelete.fileURL) {
              // Nếu là tin nhắn dạng file, xóa file liên kết trước
              await deleteFileFromStorage(messageToDelete.fileURL); // Hàm xóa file từ lưu trữ
          }
  
          // Tìm kiếm tin nhắn cần xóa trong danh sách messages
          updatedMessages = [...messages]; // Sao chép danh sách tin nhắn hiện tại
          updatedMessages.splice(selectedMessageIndex, 1); // Xóa tin nhắn tại selectedMessageIndex
  
          // Cập nhật danh sách tin nhắn trong DynamoDB
          const params = {
              TableName: "GroupChats", // Thay đổi đây
              Key: {
                  groupId: selectedGroupID, // Thay đổi đây
              },
              UpdateExpression: "SET messages = :messages",
              ExpressionAttributeValues: {
                  ":messages": updatedMessages,
              },
              ReturnValues: "UPDATED_NEW",
          };
          await dynamoDB.update(params).promise();
  
          // Cập nhật state và đóng modal
          setMessages(updatedMessages);
          closeModal();
      } catch (error) {
          console.error("Error deleting message:", error);
      }
  };
  
  const retractMessage = async () => {
      try {
        // Cập nhật tin nhắn thu hồi trong cơ sở dữ liệu của cả hai bên
        const params = {
          TableName: "GroupChats", // Thay đổi đây
          Key: {
            groupId: selectedGroupID, // Thay đổi đây
          },
          UpdateExpression: "SET messages[" + selectedMessageIndex + "].content = :content, messages[" + selectedMessageIndex + "].retracted = :retracted REMOVE messages[" + selectedMessageIndex + "].fileURL, messages[" + selectedMessageIndex + "].fileName",
          ExpressionAttributeValues: {
            ":content": "Tin nhắn đã được thu hồi",
            ":retracted": true,
          },
          ReturnValues: "UPDATED_NEW",
        };
        await dynamoDB.update(params).promise();
    
        // Cập nhật trạng thái tin nhắn thu hồi trên máy của bạn
        const updatedMessages = [...messages];
        updatedMessages[selectedMessageIndex] = {
          ...updatedMessages[selectedMessageIndex],
          content: "Tin nhắn đã được thu hồi",
          fileURL: null, // Set fileURL to null to remove it
          fileName: null, // Set fileName to null to remove it
        };
        setMessages(updatedMessages);
    
        // Đóng modal
        closeModal();
      } catch (error) {
        console.error("Error retracting message:", error);
      }
    };
    
  
    const renderModal = () => {
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={closeModal}
        >
          <Pressable style={styles.modalOverlay} onPress={closeModal} />
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedMessage && (
                <>
                  {selectedMessage.isSender ? (
                    <>
                      <Pressable style={styles.modalItem} onPress={deleteMessage}>
                        <Icon name="delete" size={25} />
                        <Text style={styles.modalItemText}>Xóa</Text>
                      </Pressable>
                      <Pressable
                        style={styles.modalItem}
                        onPress={retractMessage}
                      >
                        <Icon name="reload1" size={25} />
                        <Text style={styles.modalItemText}>Thu hồi</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable style={styles.modalItem} onPress={deleteMessage}>
                      <Icon name="delete" size={25} />
                      <Text style={styles.modalItemText}>Xóa</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
      )
    };
    // Hàm gửi file
    const sendFile = async () => {
      try {
        if (!selectedFile) {
          alert('Vui lòng chọn một file trước khi gửi.');
          return;
        }
    
        const timestamp = new Date().toISOString(); // Định nghĩa và gán giá trị cho biến timestamp
        // Tải tệp lên S3
        const fileURL = await uploadFileToS3(selectedFile);
        // Thực hiện các hành động khác cần thiết (ví dụ: gửi URL của tệp đến máy chủ của bạn)
        const fileSize = selectedFile.size; // Dung lượng của file (đơn vị byte)
    
        // Tính dung lượng của file và đơn vị đo lường
        let fileSizeWithUnit = "";
        if (fileSize < 1024) {
          fileSizeWithUnit = `${fileSize.toFixed(2)} B`;
        } else if (fileSize < 1024 * 1024) {
          fileSizeWithUnit = `${(fileSize / 1024).toFixed(2)} KB`;
        } else {
          fileSizeWithUnit = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
        }
    
        // Thay đổi nội dung của tin nhắn thành dung lượng của file với đơn vị
        const content = `${fileSizeWithUnit}`;
        
        const senderMessage = {
          content: content,
          senderSoDienThoai: user.soDienThoai,
          groupId:selectedGroupID, // Thêm trường thông tin nhóm
          timestamp: timestamp,
          isSender: true,
          fileURL: fileURL,
          fileName: selectedFile.name, // Thêm URL của file vào tin nhắn
        };
        const receiverMessage = {
          content: content,
          senderSoDienThoai: user.soDienThoai,
          groupId: selectedGroupID, // Thêm trường thông tin nhóm
          timestamp: timestamp,
          isSender: false,
          fileURL: fileURL,
          fileName: selectedFile.name, // Thêm URL của file vào tin nhắn
        };
    
        // Lưu tin nhắn vào cơ sở dữ liệu
        const params = {
          TableName: "GroupChats", // Thay đổi đây
          Key: {
            groupId: selectedGroupID, // Thay đổi đây
          },
          UpdateExpression: "SET messages = list_append(messages, :newMessage)",
          ExpressionAttributeValues: {
            ":newMessage": [senderMessage, receiverMessage],
          },
          ReturnValues: "UPDATED_NEW",
        };
        await dynamoDB.update(params).promise();
    
        scrollToBottom(); // Cuộn xuống cuối danh sách tin nhắn
        setMessages([...messages, senderMessage]);
    
        // Reset selectedFile state
        cancelDoc();
      } catch (error) {
        console.error("Error sending file:", error);
      }
    };
    
  
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
  
    // const sendMessage = async () => {
    //   if (newMessage.trim() === "" && !selectedImage) {
    //     return;
    //   }
    
    //   const timestamp = new Date().toISOString();
    
    //   let senderMessage = null;
    //   let receiverMessage = null;
    
    //   if (newMessage.trim() !== "") {
    //     senderMessage = {
    //       content: newMessage,
    //       senderSoDienThoai: user.soDienThoai,
    //       groupId: selectedGroupID, // Thay đổi đây
    //       timestamp: timestamp,
    //       isSender: true,
    //     };
    
    //     receiverMessage = {
    //       content: newMessage,
    //       senderSoDienThoai: user.soDienThoai,
    //       groupId:selectedGroupID, // Thay đổi đây
    //       timestamp: timestamp,
    //       isSender: false,
    //     };
    //   }
    
    //   if (selectedImage) {
    //     const imageUrl = await uploadImageToS3(selectedImage);
    //     if (imageUrl) {
    //       senderMessage = {
    //         content: imageUrl,
    //         senderSoDienThoai: user.soDienThoai,
    //         groupId: selectedGroupID, // Thay đổi đây
    //         timestamp: timestamp,
    //         isSender: true,
    //       };
    
    //       receiverMessage = {
    //         content: imageUrl,
    //         senderSoDienThoai: user.soDienThoai,
    //         groupId: selectedGroupID, // Thay đổi đây
    //         timestamp: timestamp,
    //         isSender: false,
    //       };
    //     } else {
    //       console.error("Error uploading image to S3");
    //       return;
    //     }
    //   }
    
    //   try {
    //     if (senderMessage && receiverMessage) {
    //       const params = {
    //         TableName: "GroupChats", // Thay đổi đây
    //         Key: {
    //           groupId: selectedGroupID, // Thay đổi đây
    //         },
    //         UpdateExpression: "SET messages = list_append(messages, :newMessage)",
    //         ExpressionAttributeValues: {
    //           ":newMessage": [senderMessage, receiverMessage],
    //         },
    //         ReturnValues: "UPDATED_NEW",
    //       };
    //       await dynamoDB.update(params).promise();
    //     }
    
    //     setMessages([...messages, senderMessage]);
    //     setNewMessage("");
    //     setSelectedImage(null);
    //     scrollToBottom();
    //   } catch (error) {
    //     console.error("Error sending message:", error);
    //   }
    // };
    useEffect(() => {
      if (group && group.groupId) {
        setSelectedGroupID(group.groupId);
        console.log("GroupId:",group.groupId)
      }
    }, [group]);
  
    useEffect(() => {
      const interval = setInterval(fetchMessages, 500);
      return () => clearInterval(interval);
    }, [selectedGroupID]);

    const fetchMessages = async () => {
      if (!selectedGroupID) {
        console.error("groupId is not set");
        return;
      }
      try {
        console.log("Fetching messages for groupId:", selectedGroupID);
        const groupParams = {
          TableName: "GroupChats",
          Key: {
            groupId: selectedGroupID,
          },
        };
        const groupResponse = await dynamoDB.get(groupParams).promise();
        const groupMessages = groupResponse.Item && groupResponse.Item.messages ? groupResponse.Item.messages : [];
        setMessages(groupMessages);
        
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      }
    };
    const sendMessage = async () => {
      try {
          if (newMessage.trim() === "" && !selectedImage) {
              return;
          }
  
          const timestamp = new Date().toISOString();
          const groupId = selectedGroupID;
          const members = group.members;
  
          let senderMessage = null;
          let receiverMessages = [];
  
          if (newMessage.trim() !== "") {
              senderMessage = {
                  content: newMessage,
                  senderSoDienThoai: user.soDienThoai,
                  groupId: groupId,
                  timestamp: timestamp,
                  isSender: true,
              };
  
              receiverMessages = members.map(member => ({
                  content: newMessage,
                  //senderSoDienThoai: user.soDienThoai,
                  groupId: groupId,
                  timestamp: timestamp,
                  isSender: false,
                  receiverSoDienThoai: member
              }));
          }
  
          if (selectedImage) {
              const imageUrl = await uploadImageToS3(selectedImage);
              if (imageUrl) {
                  senderMessage = {
                      content: imageUrl,
                      senderSoDienThoai: user.soDienThoai,
                      groupId: groupId,
                      timestamp: timestamp,
                      isSender: true,
                  };
  
                  receiverMessages = members.map(member => ({
                      content: imageUrl,
                      senderSoDienThoai: user.soDienThoai,
                      groupId: groupId,
                      timestamp: timestamp,
                      isSender: false,
                      receiverSoDienThoai: member
                  }));
              } else {
                  console.error("Error uploading image to S3");
                  return;
              }
          }
  
          const updatePromises = [];
          if (senderMessage) {
              const paramsSender = {
                  TableName: "GroupChats",
                  Key: { groupId: groupId },
                  UpdateExpression: "SET messages = list_append(if_not_exists(messages, :emptyList), :senderMessage)",
                  ExpressionAttributeValues: {
                      ":senderMessage": [senderMessage],
                      ":emptyList": []
                  },
                  ReturnValues: "UPDATED_NEW",
              };
              updatePromises.push(dynamoDB.update(paramsSender).promise());
          }
          receiverMessages.forEach(receiverMessage => {
              const paramsReceiver = {
                  TableName: "GroupChats",
                  Key: { groupId: groupId },
                  UpdateExpression: "SET messages = list_append(if_not_exists(messages, :emptyList), :receiverMessage)",
                  ExpressionAttributeValues: {
                      ":receiverMessage": [receiverMessage],
                      ":emptyList": []
                  },
                  ReturnValues: "UPDATED_NEW",
              };
              updatePromises.push(dynamoDB.update(paramsReceiver).promise());
          });
  
          await Promise.all(updatePromises);
  
          setMessages([...messages, senderMessage]);
          setNewMessage("");
          setSelectedImage(null);
          scrollToBottom();
      } catch (error) {
          console.error("Error sending message:", error);
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
        return data.Location; // Return image URL
      } catch (error) {
        console.error("Error uploading image to S3:", error);
        return null;
      }
    };
  
    const readAsBuffer = async (file) => {
      try {
        // Kiểm tra nếu đối tượng file không phải là một Blob, chuyển đổi nó thành Blob
        if (!(file instanceof Blob)) {
          file = new Blob([file]);
        }
    
        // Đọc dữ liệu từ tệp sử dụng FileReader
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const arrayBuffer = event.target.result;
            resolve(arrayBuffer);
          };
          reader.onerror = (error) => {
            reject(error);
          };
          reader.readAsArrayBuffer(file);
        });
    
        return arrayBuffer;
      } catch (error) {
        console.error('Lỗi khi đọc tệp:', error);
        throw error;
      }
    };
    const uploadFileToS3 = async (file) => {
      try {
        // Đọc dữ liệu từ tệp và chuyển đổi thành buffer
        const fileBuffer = await readAsBuffer(file);
    
        const params = {
          Bucket: 'longs3',
          Key: `${file.name}`, // Đường dẫn lưu trữ trên S3
          Body: fileBuffer,
          ACL: 'public-read', // ACL để cấp quyền truy cập cho tập tin
          ContentType: file.type // Kiểu nội dung của tập tin
        };
    
        const response = await s3.upload(params).promise();
        console.log('File uploaded successfully:', response.Location);
        return response.Location; // Trả về URL của tập tin đã tải lên
      } catch (error) {
        console.error('Lỗi khi tải tập tin lên S3:', error);
        throw error;
      }
    };
    const handleLongPress = (message, index) => {
      if (!message.retracted) {
          openModal(message, index);
      }
  };
return (
  <View style={styles.container}>
  <View style={styles.header}>
    <Image source={{ uri: group.avatarGroup }} style={styles.headerImg} />
    <Text style={styles.headerText}>{group.groupName}</Text>
    <Pressable style={styles.closeButton} onPress={handleClose}>
      <Text style={styles.closeButtonText}>Đóng</Text>
    </Pressable>
  </View>
  <ScrollView
    contentContainerStyle={styles.scrollViewContent}
    ref={scrollViewRef}
    onScroll={handleScroll} // Xử lý sự kiện scroll
    scrollEventThrottle={16}
  >
    {messages.map((message, index) => (
<Pressable
key={index}
onLongPress={() => handleLongPress(message, index)}
style={[
  styles.messageContainer,
  {
    alignSelf: message.isSender ? "flex-end" : "flex-start",
    backgroundColor: message.isSender ? "#94e5f2" : "#dddddd",
    opacity:
    selectedMessage && selectedMessageIndex !== index ? 0.5 : 1,
  },
]}
>
{typeof message.content === 'string' && message.content.startsWith('http') ? (
<View>
<Image source={{ uri: message.content }} style={styles.messageImage} />
<Text style={styles.messageTimestamp}>
  {formatMessageTimestamp(message.timestamp)}
</Text>
</View>
) : (
<View>
{message.fileURL ? ( // Kiểm tra nếu có fileURL thì hiển thị thông tin về file
  <View style={[styles.fileContainer, { flexDirection: "row" }]}>
  <Text style={styles.fileName}>{message.fileName}</Text>
  <Pressable
    style={{ marginLeft: 5 }}
    onPress={() =>
      handleFileDownload(message.fileURL, message.fileName)
    }
  >
    <Icon name="download" size={20} color="black" />
  </Pressable>
</View>
) : null}
{message.content && ( // Hiển thị nội dung tin nhắn văn bản nếu có
  <View>
    <Text style={styles.messageText}>{message.content}</Text>
    <Text style={styles.messageTimestamp}>
      {formatMessageTimestamp(message.timestamp)}
    </Text>
  </View>
)}
</View> 
)}
</Pressable>
))}
  </ScrollView>
  <View style={styles.inputContainer}>
  <Pressable onPress={pickFile}>
      <Icon
        name="paperclip"
        size={25}
        style={{ marginLeft: 5, borderRightWidth: 1, paddingRight: 5 }}
      />
    </Pressable>
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
    {selectedFile && (
    <View style={styles.selectedImageContainer}>
      <Text style={{ textAlign: "center", fontSize: 13 }}>
        {selectedFile.name}
      </Text>
      {/* Hiển thị thông tin khác của file nếu cần */}
      <Pressable onPress={cancelDoc} style={styles.cancelFileButton}>
        <Icon name="close" size={14} color="red" />
      </Pressable>
    </View>
  )}
    <Pressable
      style={styles.sendButton}
      onPress={() => {
        if (newMessage.trim() !== "") {
          sendMessage(); // Gửi tin nhắn văn bản nếu có nội dung tin nhắn
        } else if (selectedImage !== null) {
          sendMessage(); // Gửi hình ảnh nếu có hình ảnh được chọn
        } else if (selectedFile !== null) {
          sendFile(); // Gửi file nếu có file được chọn
        }
      }}
    >
      <Text style={styles.sendButtonText}>Gửi</Text>
    </Pressable>
  </View>
  {renderModal()}
</View>
);
};



export default GroupChats;

const styles = StyleSheet.create({
  
  messageText: {
    fontSize: 16,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    top: 400,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
    padding: 20,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  modalItem: {
    flex: 1, // Sử dụng flex để tin nhắn tự mở rộng theo nội dung của nó
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 16,
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  closeButton: {
    marginLeft:800,
    padding: 10,
  },
  closeButtonText: {
    color: 'black', // Màu của văn bản nút "Đóng"
    fontWeight: 'bold',
  },
  fileContainer: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
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
