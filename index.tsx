import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getItem } from "./lib/storage";
export default function Index(){
  useEffect(()=>{getItem("loggedIn").then(v=>router.replace(v?"/home":"/login"));},[]);
  return <View style={{flex:1,alignItems:"center",justifyContent:"center"}}><ActivityIndicator size="large"/></View>;
}
