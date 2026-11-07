import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { getItem } from "../lib/storage";

const menu = [
  { icon: "🧰", title: "Cari Jasa", detail: "Temukan penyedia jasa", route: "/services" },
  { icon: "📝", title: "Minta Bantuan", detail: "Buat permintaan jasa", route: "/request" },
  { icon: "🧑‍🔧", title: "Daftar Penyedia Jasa", detail: "Tawarkan keahlian Anda", route: "/provider" },
  { icon: "💳", title: "Pembayaran & Komisi", detail: "Aturan transaksi dan potongan 10%", route: "/payments" },
  { icon: "📋", title: "Riwayat", detail: "Lihat aktivitas bantuan", route: "/history" },
  { icon: "👤", title: "Profil", detail: "Akun dan pengaturan", route: "/profile" },
];
export default function Home() {
  const [name,setName]=useState("Pengguna");
  useEffect(()=>{getItem("user").then(v=>{if(v){try{const u=JSON.parse(v);setName(u.name||"Pengguna");}catch{}}}).catch(()=>{});},[]);
  return <ScrollView style={s.page} contentContainerStyle={s.wrap}>
    <View style={s.header}><View><Text style={s.small}>Halo 👋 Selamat datang</Text><Text style={s.name}>{name}</Text></View><View style={s.logo}><Text style={{fontSize:27}}>🆘</Text></View></View>
    <View style={s.hero}><Text style={s.heroTitle}>Butuh bantuan atau punya keahlian?</Text><Text style={s.heroText}>Hubungkan orang yang membutuhkan jasa dengan orang yang siap membantu.</Text></View>
    <Text style={s.section}>Menu Minta Tolong</Text>
    {menu.map(item=><Pressable key={item.route} style={s.item} onPress={()=>router.push(item.route as never)}><Text style={s.icon}>{item.icon}</Text><View style={{flex:1}}><Text style={s.itemTitle}>{item.title}</Text><Text style={s.detail}>{item.detail}</Text></View><Text style={s.arrow}>›</Text></Pressable>)}
    <Text style={s.footer}>🤝 Bersama, saling membantu</Text>
  </ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f5f7fb"},wrap:{padding:19,paddingBottom:35},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:15,marginBottom:18},small:{color:"#77808d",fontSize:14},name:{fontSize:25,fontWeight:"900",color:"#172033",marginTop:3},logo:{width:54,height:54,borderRadius:17,backgroundColor:"#feeceb",alignItems:"center",justifyContent:"center"},hero:{backgroundColor:"#e53935",borderRadius:18,padding:20,marginBottom:20},heroTitle:{fontSize:19,fontWeight:"900",color:"#fff"},heroText:{fontSize:13,color:"#ffeded",lineHeight:20,marginTop:7},section:{fontSize:17,fontWeight:"900",color:"#172033",marginBottom:7},item:{backgroundColor:"#fff",borderRadius:14,padding:15,marginTop:9,flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"#edf0f5"},icon:{fontSize:25,marginRight:13,width:34,textAlign:"center"},itemTitle:{fontSize:14,fontWeight:"800",color:"#172033"},detail:{fontSize:11,color:"#87909e",marginTop:4},arrow:{fontSize:27,color:"#98a2b3"},footer:{textAlign:"center",color:"#98a2b3",fontSize:12,marginTop:22}});
