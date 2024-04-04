import { SafeAreaView, StyleSheet, Text, View,Image,Pressable } from "react-native";
import React from "react";
// const renderScreen = () => {
//   if (select === 1) {
//     return <ChatScreen/>;
//   } 
// };
const Screen2 = () => {

  return (
    <SafeAreaView style={{flex:1}}>
      
      <Pressable 
        style={{backgroundColor: "white",
        height: 60,
        borderWidth: 1,
        borderColor: "black",
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10}}>
          
            <Image source={require('../../assets/img/iconHomeScreen/Avatar.png')}  
            style={styles.imgAvatar} />

          <View style={{ flex: 1,marginLeft:10}}>  
            <Text style={{ fontWeight: "bold", textAlign: "left", fontSize: 20 }}>Huỳnh Vỹ Hào</Text>
            <Text>Mai đi chơi không</Text>
          </View>   
                 
      </Pressable>
    </SafeAreaView>
  );
};

export default Screen2;

const styles = StyleSheet.create({
  imgAvatar: {
    marginTop:5,
    marginLeft:2,
    width: 50,
    height:50,
  },
  // container:{
  //   backgroundColor: "white",
  //       height: 60,
  //       borderWidth: 1,
  //       borderColor: "black",
  //       flexDirection: 'row',
  //       alignItems: 'center',
  //       paddingHorizontal: 10
  // },
});