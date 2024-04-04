import React, { useState } from "react";
import { Alert, Pressable, StyleSheet,SafeAreaView, Text, View, Image, TextInput, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import FriendScreen from "./FriendScreen";
import Screen2 from "./Screen2";
import IconAnt from "react-native-vector-icons/AntDesign";
import Icon from "react-native-vector-icons/AntDesign";
const HomeScreen = ({ navigation, route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalSetting] = useState(false);
  const [avatarUri, setAvatarUri] = useState(require('../../assets/img/iconHomeScreen/Avatar.png'));
  const [searchText, setSearchText] = useState('');
  const [username, setUsername] = useState('Huỳnh Vỹ Hào');
  const [birthday, setBirthday] = useState('26/04/2002');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('0702802237');
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [editingPhoneNumber, setEditingPhoneNumber] = useState(false);
  const [editingGender, setEditingGender] = useState(false);
  const [select, setSelect] = useState(1);
  const renderScreen = () => {
    if (select === 1) {
      return <Screen2/>;
    } else if (select === 2) {
      return <FriendScreen/>;
    }
  };
  const selectAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      setAvatarUri(result.uri);
    }
  };

  const updateProfile = () => {
    // Cập nhật thông tin cá nhân vào cơ sở dữ liệu hoặc thực hiện hành động cần thiết
    // Sau đó đóng modal
    setModalVisible(false);
  };

  return (
    <LinearGradient
      colors={["#4AD8C7", "#B728A9"]}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <Pressable onPress={() => setModalVisible(true)}>
            <Image
              source={avatarUri}
              style={styles.imgUser}
            />
          </Pressable>
          <Pressable onPress={() => setSelect(1)} style={[styles.tabItem, select === 1]}>
            <Image source={require('../../assets/img/iconHomeScreen/icons8-chat-30 (1) 1.png')} style={styles.imgChat} />
          </Pressable>
          <Pressable onPress={() => setSelect(2)} style={[styles.tabItem, select === 2]}>
            <Image source={require('../../assets/img/iconHomeScreen/icons8-phonebook-24 1.png')} style={styles.imgPhoneBook} />
          </Pressable>
          <Pressable onPress={() => setModalSetting(true)}>
            <Image source={require('../../assets/img/iconHomeScreen/icons8-setting-50 (1) 1.png')} style={styles.imgSetting} />
          </Pressable>
        </View>

        <View style={styles.Vertical} />

        <View style={styles.middle}>
          <View style={styles.tabMiddle}>
            <View style={styles.Input}>
              <Pressable>
                <Image source={require("../../assets/img/iconHomeScreen/search 1.png")} style={styles.imgSearch} />
              </Pressable>
              <TextInput
                style={styles.txtSearch}
                placeholder="Tìm kiếm"
                onChangeText={(text) => setSearchText(text)}
                value={searchText}
              />
            </View>
            <Pressable style={styles.pressableContainer}>
            <IconAnt name="adduser" size="40px" color="red" />
             
            </Pressable>
            <Pressable style={styles.pressableContainer2}>
              <IconAnt name="addusergroup" size="40px" color="red"  />
              {/* <Image source={require("../../assets/img/iconHomeScreen/users-medical 1.png")} style={styles.imgAdd} /> */}
            </Pressable>
          </View>
          <View style={styles.divider} />
          <SafeAreaView style={styles.screenContainer}>
              {select === 1 ? <Screen2/> : <FriendScreen/>}
          </SafeAreaView>  
        </View>
        <View style={styles.dividerVertical} />

        <View style={styles.chatScreen}>
          <Text style={styles.chatInfo}>Chat Info Here !!!</Text>
          <Text style={styles.chatInfo}>Click someone to see chat</Text>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Pressable
              style={styles.closeButtonContainer}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>X</Text>
            </Pressable>
            <Text style={styles.modalText}>Thông tin cá nhân</Text>
            <Pressable onPress={selectAvatar}>
              <Image
                source={avatarUri}
                style={styles.userAvatar}
              />
            </Pressable>
            <View style={styles.userInfo}>
              <Text style={styles.infoTitle}>Tên tài khoản :</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Tên tài khoản"
                value={username}
                onChangeText={text => setUsername(text)}
                editable={editingUsername}
                onFocus={() => setEditingUsername(true)}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.infoTitle}>Ngày Sinh   :</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Ngày sinh"
                value={birthday}
                onChangeText={text => setBirthday(text)}
                editable={editingBirthday}
                onFocus={() => setEditingBirthday(true)}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.infoTitle}>Giới Tính   :</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Giới tính"
                value={gender}
                onChangeText={text => setGender(text)}
                editable={editingGender}
                onFocus={() => setEditingGender(true)}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.infoTitle}>Số Điện Thoại :</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Số điện thoại"
                value={phoneNumber}
                onChangeText={text => setPhoneNumber(text)}
                editable={editingPhoneNumber}
                onFocus={() => setEditingPhoneNumber(true)}
              />
            </View>
            <Pressable
              style={[styles.button, styles.updateButton]}
              onPress={updateProfile}
            >
              <Text style={styles.textStyle}>Cập Nhật</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible2}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModalSetting(!modalVisible2);
        }}>
        <View style={styles.viewSetting}>
          <View style={styles.modalSetting}>
          <Pressable style={{marginLeft:20}}
              onPress={() => setModalSetting(!modalVisible2)}>
              <Text>X</Text>
          </Pressable>
            <Text style={styles.modalText}>Đăng xuất</Text>
            
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  pressableContainer:{
    flexDirection: 'row', 
    alignItems: 'center',
    marginLeft:10
  },
  pressableContainer2:{
    flexDirection: 'row', 
    alignItems: 'center',
    marginLeft:5
  },
  textSetting:{
    marginLeft:10
  },
  viewSetting:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalSetting:{
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    height: 500,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  textStyle: {
    backgroundColor: 'white',
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  background: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  imgUser: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  imgChat: {
    marginTop: 30,
    width: 50,
    height: 50,
  },
  imgPhoneBook: {
    marginTop: 30,
    width: 50,
    height: 50,
  },
  imgSetting: {
    marginTop: 30,
    width: 50,
    height: 50,
  },
  Vertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'gray',
    marginLeft: 15,
  },
  dividerVertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'gray',
  },
  middle: {
    backgroundColor: 'white',
    width: 400,
  },
  chatScreen: {
    width: 700,
  },
  chatInfo: {
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 30,
  },
  userAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imgSearch: {
    width: 20,
    height: 20,
    marginLeft: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  imgAdd: {
    width: 29,
    height: 30,
    marginLeft: 15,
    marginTop: 10
  },
  txtSearch: {
    fontSize: 20,
  },
  Input: {
    width: 290,
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'space-evenly',
    marginLeft: 15
  },
  tabMiddle: {
    flexDirection: 'row',
    marginTop: 20
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#8C8787',
    marginTop: 10,
  },
  inputField: {
    flex: 1, // Đặt ô nhập văn bản để mở rộng để lấp đầy không gian còn lại
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingLeft: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  updateButton: {
    backgroundColor: '#4AD8C7',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 20,
  },
});
