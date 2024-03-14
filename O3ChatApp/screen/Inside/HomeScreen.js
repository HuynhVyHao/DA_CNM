import { Alert, BackHandler, SafeAreaView, StyleSheet, Text, View, Image,TextInput,Pressable} from "react-native";
import React from "react";
import Icon from "react-native-vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";
import IconAnt from "react-native-vector-icons/AntDesign";





const HomeScreen = ({  navigation,route }) => {


  return (
    <LinearGradient
      // Background Linear Gradient
      colors={["#4AD8C7", "#B728A9"]}
      style={styles.background}
    >

      {/* Tab Bar Option  */}

      <View style={styles.container}>
        <View style={styles.tabBar}>
          <Pressable>
            <Image source={require('../../assets/img/iconHomeScreen/Avatar.png')}
                   style={styles.imgUser}
            />
          </Pressable>
          <Pressable>
          <Image source={require('../../assets/img/iconHomeScreen/icons8-chat-30 (1) 1.png')}
                   style={styles.imgChat}
            />
          </Pressable>
          <Pressable>
          <Image source={require('../../assets/img/iconHomeScreen/icons8-phonebook-24 1.png')}
                   style={styles.imgPhoneBook}
            />
          </Pressable>
          <Pressable>
          <Image source={require('../../assets/img/iconHomeScreen/icons8-setting-50 (1) 1.png')}
                   style={styles.imgSetting}
            />
          </Pressable>
        </View>


        <View style={styles.Vertical}/>



        {/* Middle Screen */}

        <View style={styles.middle}>
          <View style={styles.tabMiddle}>
            <View style={styles.Input}>
              <Pressable>
              <Image source={require("../../assets/img/iconHomeScreen/search 1.png")}
                     style={styles.imgSearch}
              />
              </Pressable>
              <TextInput style={styles.txtSearch} placeholder="Tìm kiếm"/>
            </View>
            <Pressable>
            <Image source={require("../../assets/img/iconHomeScreen/user-add 1.png")} 
                   style={styles.imgAdd} 
            />
            </Pressable>
            <Pressable>
            <Image source={require("../../assets/img/iconHomeScreen/users-medical 1.png")} 
                   style={styles.imgAdd} 
            />
            </Pressable>

            </View>
          <View style={styles.divider}/>
        </View>

        <View style={styles.dividerVertical}/>
        {/* Chat Info */}

        <View style={styles.chatScreen}>
          <Text style={styles.chatInfo}>Chat Info Here !!!</Text>
          <Text style={styles.chatInfo}>Click someone to see chat</Text>
        </View>


      </View>
      
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  background: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
  imgUser:{
    width: 50,
    height:50,
  },
  imgChat:{
    marginTop:30,
    width: 50,
    height:50,
  },
  imgPhoneBook:{
    marginTop:30,
    width: 50,
    height:50,
  },
  imgSetting:{
    marginTop:420,
    width: 50,
    height:50,
  },
  Vertical:{
    width: 1,
    height: "100%",
    backgroundColor: 'gray',
    marginLeft: 15,
  },
  dividerVertical:{
    width: 1,
    height: "100%",
    backgroundColor: 'gray',
  },
  divider:{
    width: "100%",
    height: 1,
    backgroundColor: '#8C8787',
    marginTop: 10,
  },
  imgSearch:{
    width: 20,
    height:20,
    marginLeft:10,
    marginTop:15,
    alignItems:'center'
  },
  imgAdd:{
    width: 29,
    height:30,
    marginLeft:15,
    marginTop:10
  },
  txtSearch:{
    fontSize:20,

  },
  tabBar:{
    marginTop: 20,
    marginLeft:15
  },
  middle:{
    backgroundColor:'white',
    width:400
  },
  Input:{
    width:290,
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    flexDirection: 'row',
    height:50,
    justifyContent: 'space-evenly',
    marginLeft:15
  },
  tabMiddle:{
    flexDirection: 'row',
    marginTop:20
  },
  chatScreen:{
    width:900,
  },
  chatInfo:{
    textAlign:'center', 
    justifyContent: 'center', 
    alignItems:'center',
    fontSize:30
  }
});
