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
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, S3_BUCKET_NAME } from "@env";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/AntDesign";
import * as DocumentPicker from "expo-document-picker";

const GroupChats = ({ user, onClose, group }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const [groups,setGroup]=useState(group);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedGroupID, setSelectedGroupID] = useState(null);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isModalDeleteGroup,setIsModalDeleteGroup]=useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState({});
  const [friendsNotInGroup, setFriendsNotInGroup] = useState([]);
  const [friendsInGroup, setFriendsInGroup] = useState([]);
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
   // Trong hàm renderOptions:
   const renderOptions = () => {
    // Sắp xếp danh sách friendsInGroup để đưa Trưởng nhóm lên đầu
    const sortedFriendsInGroup = [...friendsInGroup].sort((a, b) => {
      if (groups.roles[a.email] === "Trưởng nhóm") return -1;
      if (groups.roles[b.email] === "Trưởng nhóm") return 1;
      return 0;
    });
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isOptionsVisible}
        onRequestClose={() => setIsOptionsVisible(false)}
      >
        <View style={styles.optionsContainer}>
          <View style={styles.membersContainer}>
            <Text style={styles.memberHeaderText}>Thành viên trong nhóm:</Text>
            <ScrollView>
              {sortedFriendsInGroup.length > 0 ? (
                sortedFriendsInGroup.map((friend, index) => (
                  <View key={index} style={styles.infoMenu}>
                    <Pressable
                      style={styles.checkboxContainer}
                      onPress={() => toggleFriendSelection(friend.email)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: selectedFriends[friend.email]
                              ? "black"
                              : "transparent",
                          },
                        ]}
                      >
                        {selectedFriends[friend.email] && (
                          <Icon name="check" size={18} color="white" />
                        )}
                      </View>
                    </Pressable>
                    <Image
                      style={styles.avatarImage}
                      source={{ uri: friend.avatarUser }}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.txtUser}>{friend.hoTen}</Text>
                      <Text style={styles.txtRole}>
                        {groups.roles[friend.email]}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.txtUser}>Không có bạn bè</Text>
              )}
            </ScrollView>
          

          <Pressable style={styles.optionItem} onPress={openAddMemberModal}>
            <Text style={styles.optionText}>Thêm thành viên</Text>
          </Pressable>
          <Pressable
            style={styles.optionItem}
            onPress={handleDeleteSelectedMembers}
          >
            <Text style={styles.optionText}>Xóa thành viên</Text>
          </Pressable>
          <Pressable style={styles.optionItem} onPress={leaveGroup}>
            <Text style={styles.optionText}>Rời nhóm</Text>
          </Pressable>
          <Pressable style={styles.optionItem} onPress={handleDeleteGroup}>
            <Text style={styles.optionText}>Giải tán nhóm</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsOptionsVisible(false)}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </Pressable>
        </View>
        </View>
      </Modal>
    );
  };
  const addSelectedMembersToGroup = async () => {
    try {
      const selectedMembers = Object.keys(selectedFriends).filter(
        (email) => selectedFriends[email]
      );
      if (selectedMembers.length === 0) {
        console.log("No members selected.");
        return;
      }

      const updatedGroupMembers = [...groups.members, ...selectedMembers];
      const updatedGroupRoles = { ...groups.roles };

      selectedMembers.forEach((email) => {
        updatedGroupRoles[email] = "Thành viên";
      });

      const params = {
        TableName: "GroupChats",
        Key: {
          groupId: `${groups.groupId}`,
        },
        UpdateExpression: "SET members = :members, #roles = :roles",
        ExpressionAttributeNames: {
          "#roles": "roles",
        },
        ExpressionAttributeValues: {
          ":members": updatedGroupMembers,
          ":roles": updatedGroupRoles,
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(params).promise();

      setGroup((prevGroup) => ({
        ...prevGroup,
        members: updatedGroupMembers,
        roles: updatedGroupRoles,
      }));

      setIsAddMemberModalVisible(false);
    } catch (error) {
      console.error("Error adding members to groups:", error);
    }
  };
   // Hàm xử lý khi người dùng chọn "Rời nhóm"
   const leaveGroup = async () => {
    
    try {
      if(isGroupLeader){
        alert("Bạn phải chuyển quyền trưởng nhóm!")
        return;
      }
      // Loại bỏ người dùng ra khỏi danh sách thành viên của nhóm
      const updatedGroupMembers = groups.members.filter(
        (member) => member !== user.email
      );

      // Loại bỏ người dùng ra khỏi danh sách vai trò của nhóm
      const updatedGroupRoles = { ...groups.roles };
      delete updatedGroupRoles[user.email];

      // Cập nhật dữ liệu trong cơ sở dữ liệu
      const params = {
        TableName: "GroupChats",
        Key: {
          groupId: groups.groupId,
        },
        UpdateExpression: "SET members = :members, #r = :roles",
        ExpressionAttributeValues: {
          ":members": updatedGroupMembers,
          ":roles": updatedGroupRoles,
        },
        ExpressionAttributeNames: {
          "#r": "roles",
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(params).promise();

      // Cập nhật state của nhóm để loại bỏ người dùng ra khỏi danh sách thành viên và vai trò
      setGroup((prevGroup) => ({
        ...prevGroup,
        members: updatedGroupMembers,
        roles: updatedGroupRoles,
      }));

      // Đóng modal sau khi rời nhóm thành công
      setIsOptionsVisible(false);
      navigation.goBack();
      // Thực hiện các hành động cần thiết sau khi rời nhóm thành công
      // Ví dụ: hiển thị thông báo, cập nhật giao diện người dùng, v.v.
    } catch (error) {
      console.error("Error leaving groups:", error);
      // Xử lý lỗi cụ thể ở đây, ví dụ: hiển thị thông báo lỗi cho người dùng
    }
  };
 // Hàm kiểm tra vai trò của người dùng
  const isGroupLeader = () => {
    return groups.roles && groups.roles[user.email] === "Trưởng nhóm";
  };
  // Hàm xóa thành viên khỏi nhóm trong DynamoDB
  const deleteMembersFromGroup = async (selectedEmails) => {
    try {
      // Tạo một bản cập nhật để loại bỏ các thành viên đã chọn khỏi nhóm
      const updatedGroupMembers = groups.members.filter(
        (member) => !selectedEmails.includes(member)
      );

      // Cập nhật danh sách thành viên của nhóm trong DynamoDB
      const params = {
        TableName: "GroupChats", // Thay thế bằng tên bảng của bạn
        Key: {
          groupId: `${groups.groupId}`, // Sử dụng groupId của nhóm cần cập nhật
        },
        UpdateExpression: "SET members = :members",
        ExpressionAttributeValues: {
          ":members": updatedGroupMembers,
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(params).promise();

      // Cập nhật state của nhóm để hiển thị người dùng mới
      setGroup((prevGroup) => ({
        ...prevGroup,
        members: updatedGroupMembers,
      }));

      // Đóng modal sau khi xóa thành viên thành công
      setIsOptionsVisible(false);

      // Thực hiện các hành động cần thiết khác sau khi xóa thành viên
      // Ví dụ: hiển thị thông báo, cập nhật giao diện người dùng, v.v.
    } catch (error) {
      console.error("Error deleting members from groups:", error);
      // Xử lý lỗi cụ thể ở đây, ví dụ: hiển thị thông báo lỗi cho người dùng
    }
  };
// Hàm xử lý khi nhấn nút "Xóa thành viên"
  const handleDeleteSelectedMembers = () => {
    if (isGroupLeader()) {
      const selectedEmails = Object.keys(selectedFriends).filter(
        (email) => selectedFriends[email]
      );

      if (selectedEmails.length === 0) {
        alert("Vui lòng chọn ít nhất một thành viên để xóa");
        return;
      }

      // Gọi hàm xóa thành viên khỏi nhóm
      deleteMembersFromGroup(selectedEmails);
    } else {
      alert("Bạn không có quyền thực hiện hành động này.");
    }
  };
  const openAddMemberModal = () => {
    setIsAddMemberModalVisible(true);
    fetchFriendsNotInGroup();
  };
  const toggleFriendSelection = (email) => {
    setSelectedFriends((prevSelectedFriends) => ({
      ...prevSelectedFriends,
      [email]: !prevSelectedFriends[email],
    }));
  };
  // Hàm đóng modal
  const closeAddMemberModal = () => {
    setIsAddMemberModalVisible(false);
  };
  const handleDeleteGroup = () => {
    if (isGroupLeader()) {
     setIsModalDeleteGroup(true);
            
    } else {
      alert("Bạn không có quyền thực hiện hành động này.");
    }
  };
  const DeleteGroup = async  ()=>{
    try {
      // Thực hiện logic xóa nhóm trên AWS
      const params = {
        TableName: "GroupChats", // Thay thế bằng tên bảng của bạn
        Key: {
          groupId: `${groups.groupId}`, // Sử dụng groupId của nhóm cần xóa
        },
      };
      await dynamoDB.delete(params).promise();

      // Chuyển người dùng trở lại màn hình trước đó sau khi xóa nhóm thành công
      setIsModalDeleteGroup(false);
    } catch (error) {
      console.error("Error deleting groups:", error);
    }
  };
  const fetchFriendsNotInGroup = async () => {
    try {
      if (!user?.email || !groups?.groupId) {
        console.error("User email or groups ID is not defined.");
        return;
      }

      const getFriendsParams = {
        TableName: "Friends",
        Key: { senderEmail: user.email },
      };
      const friendData = await dynamoDB.get(getFriendsParams).promise();

      if (friendData.Item && friendData.Item.friends) {
        const existingGroupMemberEmails = groups.members.map((member) => member);
        const friendEmails = friendData.Item.friends
          .filter(friend => !existingGroupMemberEmails.includes(friend.email))
          .map(friend => friend.email);

        // Array to store friend details
        const friendDetails = [];

        // Loop through friend emails
        for (const friendEmail of friendEmails) {
          // Get friend's details from Users table
          const getUserParams = {
            TableName: "Users",
            Key: { email: friendEmail },
          };
          const userData = await dynamoDB.get(getUserParams).promise();

          // If user data exists, push it to friendDetails array
          if (userData.Item) {
            friendDetails.push(userData.Item);
          }
        }

        // Truy vấn cơ sở dữ liệu để lấy vai trò của các bạn trong nhóm
        const getRolesParams = {
          TableName: "GroupChats",
          Key: { groupId: groups.groupId },
        };
        const groupData = await dynamoDB.get(getRolesParams).promise();

        if (groupData.Item && groupData.Item.roles) {
          // Duyệt qua danh sách bạn mới thêm vào và thiết lập vai trò cho họ
          const friendsWithRoles = friendDetails.map((friend) => ({
            ...friend,
            role: groupData.Item.roles[friend.email] || "Thành viên",
          }));
          setFriendsNotInGroup(friendsWithRoles);
        } else {
          // Nếu không tìm thấy dữ liệu về vai trò, mặc định vai trò của các bạn là "Thành viên"
          const friendsWithRoles = friendDetails.map((friend) => ({
            ...friend,
            role: "Thành viên",
          }));
          setFriendsNotInGroup(friendsWithRoles);
        }
      } else {
        setFriendsNotInGroup([]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      // Xử lý lỗi cụ thể ở đây, ví dụ: hiển thị thông báo lỗi cho người dùng
    }
  };

  const fetchFriendsInGroup = async () => {
    try {
      if (!user?.email) {
        console.error("User email is not defined.");
        return;
      }

      const getUsersParams = {
        TableName: "Users",
      };
      const usersData = await dynamoDB.scan(getUsersParams).promise();

      if (usersData.Items) {
        const allUsers = usersData.Items;
        const groupMemberEmails = groups.members;
        const friendsInGroup = allUsers.filter((user) =>
          groupMemberEmails.includes(user.email)
        );
        setFriendsInGroup(friendsInGroup);
      } else {
        setFriendsInGroup([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Xử lý lỗi cụ thể ở đây, ví dụ: hiển thị thông báo lỗi cho người dùng
    }
  };

  useEffect(() => {
    fetchFriendsInGroup();
    fetchFriendsNotInGroup();
  }, [groups]);
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
    // Tải file về dưới dạng blob
    const response = await fetch(fileURL);
    const blob = await response.blob();

    // Tạo URL cho blob
    const url = window.URL.createObjectURL(blob);

    // Tạo một phần tử <a> ẩn để tải xuống tệp
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Giải phóng URL cho blob
    window.URL.revokeObjectURL(url);

    // Hiển thị thông báo cho người dùng
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
        Bucket: "longs3", // Thay thế bằng tên bucket của bạn
        Key: filePath, // Đường dẫn đến file trong bucket
      };

      // Gửi yêu cầu xóa file tới S3
      await s3.deleteObject(params).promise();

      console.log("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
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
        UpdateExpression:
          "SET messages[" +
          selectedMessageIndex +
          "].content = :content, messages[" +
          selectedMessageIndex +
          "].retracted = :retracted REMOVE messages[" +
          selectedMessageIndex +
          "].fileURL, messages[" +
          selectedMessageIndex +
          "].fileName",
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
                {selectedMessage.senderEmail === user.email ? ( // Kiểm tra xem người gửi có phải là người dùng hiện tại không
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
    );
  };
  
  // Hàm gửi file
  const sendFile = async () => {
    try {
      if (!selectedFile) {
        alert("Vui lòng chọn một file trước khi gửi.");
        return;
      }
  
      const timestamp = new Date().toISOString();
  
      // Tải tệp lên S3
      const fileURL = await uploadFileToS3(selectedFile);
      const fileSize = selectedFile.size;
  
      // Tính dung lượng của file và đơn vị đo lường
      let fileSizeWithUnit = "";
      if (fileSize < 1024) {
        fileSizeWithUnit = `${fileSize.toFixed(2)} B`;
      } else if (fileSize < 1024 * 1024) {
        fileSizeWithUnit = `${(fileSize / 1024).toFixed(2)} KB`;
      } else {
        fileSizeWithUnit = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
      }
  
      const content = `${fileSizeWithUnit}`;
  
      const senderMessage = {
        content: content,
        senderEmail: user.email,
        groupId: selectedGroupID,
        timestamp: timestamp,
        isSender: true,
        fileURL: fileURL,
        fileName: selectedFile.name,
      };
  
      const params = {
        TableName: "GroupChats",
        Key: {
          groupId: senderMessage.groupId,
        },
        UpdateExpression:
          "SET messages = list_append(if_not_exists(messages, :empty_list), :newMessage)",
        ExpressionAttributeValues: {
          ":empty_list": [],
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(params).promise();
  
      setMessages([...messages, senderMessage]);
      cancelDoc();
      scrollToBottom();
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
      console.error("Error selecting image:", error);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  
  useEffect(() => {
    if (groups && groups.groupId) {
      setSelectedGroupID(groups.groupId);
      console.log("GroupId:", groups.groupId);
    }
  }, [groups]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      await fetchMessages();
    }, 500);

    // Gọi hàm fetchMessages khi component được mount lần đầu tiên
    // fetchMessages();

    // Cleanup function để ngăn chặn memory leaks khi component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchMessages = async () => {
    try {
      const senderParams = {
        TableName: "GroupChats",
        Key: {
          groupId: `${groups.groupId}`,
        },
      };
      const senderResponse = await dynamoDB.get(senderParams).promise();
      const senderMessages = senderResponse.Item
        ? senderResponse.Item.messages
        : [];

      // Lặp qua các tin nhắn để lấy thông tin về người gửi từ bảng Users
      const updatedMessages = await Promise.all(
        senderMessages.map(async (message) => {
          // Gọi hàm không đồng bộ để lấy thông tin người gửi
          const senderInfo = await fetchSenderInfo(message.senderEmail);
          // Thêm thông tin về người gửi vào tin nhắn
          return { ...message, senderInfo };
        })
      );

      // Cập nhật trạng thái messages với các tin nhắn đã được cập nhật thông tin người gửi
      setMessages(updatedMessages);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchSenderInfo = async (email) => {
    try {
      const params = {
        TableName: "Users",
        Key: { email: email },
      };
      const response = await dynamoDB.get(params).promise();
      return response.Item; // Trả về toàn bộ thông tin của người gửi
    } catch (error) {
      console.error("Error fetching sender info:", error);
      return null; // Trả về null nếu xảy ra lỗi
    }
  };
  const sendImage = async () => {
    try {
      if (!selectedImage) {
        alert("Vui lòng chọn một hình ảnh trước khi gửi.");
        return;
      }
      const timestamp = new Date().toISOString();
      // Tải hình ảnh lên S3
      const imageUrl = await uploadImageToS3(selectedImage);
  
      const senderMessage = { 
        content: imageUrl,
        senderEmail: user.email,
        groupId: groups.groupId,
        timestamp: timestamp,
        isSender: true,
      };
      const params = {
        TableName: "GroupChats",
        Key: {
          groupId: senderMessage.groupId,
        },
        UpdateExpression:
          "SET messages = list_append(if_not_exists(messages, :empty_list), :newMessage)",
        ExpressionAttributeValues: {
          ":empty_list": [],
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
  
      // Thêm đoạn mã này để ghi log chi tiết cho yêu cầu
      console.log("Params sent to DynamoDB: ", JSON.stringify(params, null, 2));
  
      await dynamoDB.update(params).promise();
  
      setMessages([...messages, senderMessage]);
      cancelDoc();
      scrollToBottom();
    } catch (error) {
      console.error("Error sending image:", error);
    }
  };
  
  const sendMessage = async () => {
    let senderMessage = null;
    try {
      if (newMessage.trim() === "") return;

      const timestamp = new Date().toISOString();
       senderMessage = {
        content: newMessage,
        groupId: groups.groupId,
        senderEmail: user.email,
        timestamp: timestamp,
      };
      if (selectedImage) {
        const imageUrl = await uploadImageToS3(selectedImage);
        if (imageUrl) {
          senderMessage = {
            content: imageUrl,
            senderEmail:user,email,
            groupId: groups.groupId,
            timestamp: timestamp,
            isSender: true,
          };
        }
      }
      const params = {
        TableName: "GroupChats",
        Key: {
          groupId: senderMessage.groupId,
        },
        UpdateExpression:
          "SET messages = list_append(if_not_exists(messages, :empty_list), :newMessage)",
        ExpressionAttributeValues: {
          ":empty_list": [],
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(params).promise();

      setMessages([...messages, senderMessage]);
      setNewMessage("");
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
      console.error("Lỗi khi đọc tệp:", error);
      throw error;
    }
  };
  const uploadFileToS3 = async (file) => {
    try {
      // Đọc dữ liệu từ tệp và chuyển đổi thành buffer
      const fileBuffer = await readAsBuffer(file);

      const params = {
        Bucket: "longs3",
        Key: `${file.name}`, // Đường dẫn lưu trữ trên S3
        Body: fileBuffer,
        ACL: "public-read", // ACL để cấp quyền truy cập cho tập tin
        ContentType: file.type, // Kiểu nội dung của tập tin
      };

      const response = await s3.upload(params).promise();
      console.log("File uploaded successfully:", response.Location);
      return response.Location; // Trả về URL của tập tin đã tải lên
    } catch (error) {
      console.error("Lỗi khi tải tập tin lên S3:", error);
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
        <Image source={{ uri: groups.avatarGroup }} style={styles.headerImg} />
        <Text style={styles.headerText}>{groups.groupName}</Text>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </Pressable>
        <Pressable
          onPress={() => setIsOptionsVisible(true)}
          style={styles.optionsButton}
        >
          <Icon name="ellipsis1" size={25} color="white" />
        </Pressable>
        {renderOptions()}
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        ref={scrollViewRef}
        onScroll={handleScroll} // Xử lý sự kiện scroll
        scrollEventThrottle={16}
      >
        {messages.map((message, index) => (
          <View key={index}>
            {message.senderEmail !== user.email && (
              <View style={{ flexDirection: "row" }}>
                {message.senderInfo && message.senderInfo.avatarUser && (
                  <Image
                    source={{ uri: message.senderInfo.avatarUser }}
                    style={styles.avatarImage}
                  />
                )}
                <Pressable
                  key={index}
                  onLongPress={() => handleLongPress(message, index)}
                  style={[
                    styles.messageContainer,
                    {
                      alignSelf: "flex-start",
                      backgroundColor: "#dddddd",
                      opacity:
                        selectedMessage && selectedMessageIndex !== index
                          ? 0.5
                          : 1,
                      marginLeft: 10, // Add margin to separate avatar and message
                    },
                  ]}
                >
                  {message.senderInfo && message.senderInfo.hoTen && (
                    <Text style={{ fontWeight: "bold", fontSize: 13 }}>
                      {message.senderInfo.hoTen}
                    </Text>
                  )}
                 {typeof message.content === "string" &&
            message.content.startsWith("http") ? (
              <View>
                <Image
                  source={{ uri: message.content }}
                  style={styles.messageImage}
                />
                <Text style={styles.messageTimestamp}>
                  {formatMessageTimestamp(message.timestamp)}
                </Text>
              </View>
            ) : (
              <View>
                {message.fileURL ? ( // Kiểm tra nếu có fileURL thì hiển thị thông tin về file
                  <View
                    style={[styles.fileContainer, { flexDirection: "row" }]}
                  >
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
                  {/* <Text style={styles.messageTimestamp}>
                    {formatMessageTimestamp(message.timestamp)}
                  </Text> */}
                </Pressable>
              </View>
            )}
            {message.senderEmail === user.email && (
              <View style={{ flexDirection: "row-reverse" }}>
                <Pressable
                  key={index}
                  onLongPress={() => handleLongPress(message, index)}
                  style={[
                    styles.messageContainer,
                    {
                      alignSelf: "flex-end",
                      backgroundColor: "#94e5f2",
                      opacity:
                        selectedMessage && selectedMessageIndex !== index
                          ? 0.5
                          : 1,
                    },
                  ]}
                >
                  {typeof message.content === "string" &&
            message.content.startsWith("http") ? (
              <View>
                <Image
                  source={{ uri: message.content }}
                  style={styles.messageImage}
                />
                <Text style={styles.messageTimestamp}>
                  {formatMessageTimestamp(message.timestamp)}
                </Text>
              </View>
            ) : (
              <View>
                {message.fileURL ? ( // Kiểm tra nếu có fileURL thì hiển thị thông tin về file
                  <View
                    style={[styles.fileContainer, { flexDirection: "row" }]}
                  >
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
                  {/* <Text style={styles.messageTimestamp}>
                    {formatMessageTimestamp(message.timestamp)}
                  </Text> */}
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddMemberModalVisible}
        onRequestClose={() => setIsAddMemberModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              {friendsNotInGroup.length > 0 ? (
                friendsNotInGroup.map((friend, index) => (
                  <Pressable
                    key={index}
                    onPress={() => toggleFriendSelection(friend.email)}
                    style={{ flexDirection: "row", marginTop: 10 }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: selectedFriends[friend.email]
                            ? "black"
                            : "#ccc",
                        },
                      ]}
                    >
                      {selectedFriends[friend.email] ? (
                        <Icon name="check" size={18} color="black" />
                      ) : null}
                    </View>
                    <Image
                      style={styles.avatarImage}
                      source={{ uri: friend.avatarUser }}
                    />
                    <Text style={styles.txtUser}>{friend.hoTen}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.txtUser}>Không có bạn bè</Text>
              )}
            </ScrollView>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <Pressable onPress={closeAddMemberModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </Pressable>
            <Pressable
              onPress={addSelectedMembersToGroup}
              style={styles.addMemberButton}
            >
              <Text style={styles.addMemberButtonText}>Thêm</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalDeleteGroup}
        onRequestClose={() => setIsModalDeleteGroup(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{textStyle:"Bold",textSize:30}}>Bạn có chắc muốn giải tán nhóm không?</Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <Pressable onPress={() =>setIsModalDeleteGroup(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Không</Text>
            </Pressable>
            <Pressable
              onPress={DeleteGroup}
              style={styles.addMemberButton}
            >
              <Text style={styles.addMemberButtonText}>Có</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
            />
            <Pressable
              onPress={removeSelectedImage}
              style={styles.removeImageButton}
            >
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
              sendImage(); // Gửi hình ảnh nếu có hình ảnh được chọn
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
  optionsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '40%',
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  memberHeaderText:{
    marginLeft:10,
    fontWeight: 'bold',
    fontSize:30,
  },
  membersContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  infoMenu: {
    width: "100%",
    height: 65,
    paddingLeft: 10,
    backgroundColor: "white",
    flexDirection: "row",
    borderColor: "#ccc",
    alignItems: "center",
  },
txtUser: {
    marginTop: 5,
    color: "#000",
    fontSize: 18,
    marginLeft: 10,
  },
txtRole: {
    marginLeft: 10,
    fontSize: 12,
    color: "gray",
  },
userInfo: {
    flexDirection: "column",
    marginLeft: 10,
  },
optionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  optionText: {
    fontSize: 25,
    fontWeight: 'bold',
  },
optionsButton: {
    position: "absolute",
    right: 10,
    top: 10,
  },
cancelButton: {
    marginTop: 10,
  },
cancelButtonText: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    color: "red",
  },
checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignSelf: "center",
  },
  messageText: {
    fontSize: 16,
  },
  modalContainer: {
    top:40,
    left:500,
    weight:"40%",
    height:"50%",
    position: 'absolute',
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
    padding: 20,
    justifyContent: 'space-between', // Ensures the footer stays at the bottom
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
    marginLeft: 800,
    padding: 10,
  },
  closeButtonText: {
    color: "black", // Màu của văn bản nút "Đóng"
    fontWeight: "bold",
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
  headerImg: {
    borderRadius: 20,
    width: 50,
    height: 50,
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
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  removeImageButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.5)",
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
    position: "absolute",
    top: 5,
    left: 20,
    padding: 10,
  },
  txtBack: {
    color: "#FFF",
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
  avatarImage: {
    width: 35,
    height: 35,
    borderRadius: 25,
    marginLeft: 13,
    borderWidth: 1,
    borderColor: "#000",
    top: 5,
  },
  addMemberButton: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addMemberButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
