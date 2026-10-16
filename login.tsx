
import {useState} from "react";
import {View,Text,TextInput,Pressable,StyleSheet,Alert} from "react-native";
import {router} from "expo-router"; import {setItem} from "./lib/storage";
export default function Login(){const[email,setEmail]=useState("");const[pass,setPass]=useState("");
const go=async()=>{if(!email||!pass)return Alert.alert("Lengkapi","Email dan password wajib diisi.");await setItem("loggedIn","1");await setItem("user",JSON.stringify({name:email.split("@")[0]||"Pengguna",email}));router.replace("/home")};
return <View style={s.wrap}><Text style={s.logo}>🆘</Text><Text style={s.title}>Minta Tolong</Text><Text style={s.sub}>Bantu orang terdekat, mulai dari sekitar kita.</Text>
<TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none"/><TextInput style={s.input} placeholder="Password" value={pass} onChangeText={setPass} secureTextEntry/>
<Pressable style={s.btn} onPress={go}><Text style={s.btnT}>Masuk</Text></Pressable><Pressable onPress={()=>router.push("/register")}><Text style={s.link}>Belum punya akun? Daftar</Text></Pressable></View>}
const s=StyleSheet.create({wrap:{flex:1,justifyContent:"center",padding:24,backgroundColor:"#fff"},logo:{fontSize:58,textAlign:"center"},title:{fontSize:30,fontWeight:"800",textAlign:"center",marginTop:8},sub:{textAlign:"center",color:"#666",marginBottom:28},input:{borderWidth:1,borderColor:"#ddd",borderRadius:12,padding:14,marginBottom:12,fontSize:16},btn:{backgroundColor:"#e53935",padding:15,borderRadius:12,alignItems:"center"},btnT:{color:"#fff",fontWeight:"700",fontSize:17},link:{textAlign:"center",color:"#e53935",marginTop:18,fontWeight:"600"}});
