import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";

const categories = [
  { icon: "🔧", name: "Perbaikan", detail: "Servis motor, elektronik, rumah" },
  { icon: "🧹", name: "Kebersihan", detail: "Bersih rumah dan halaman" },
  { icon: "🚚", name: "Angkut & antar", detail: "Pindahan, kurir, belanja" },
  { icon: "💡", name: "Teknologi", detail: "HP, komputer, jaringan" },
  { icon: "🌿", name: "Kebun", detail: "Potong rumput dan perawatan" },
  { icon: "🛠️", name: "Lainnya", detail: "Bantuan sesuai keahlian" },
];

export default function Services() {
  const [query, setQuery] = useState("");
  const shown = categories.filter(x => (x.name + x.detail).toLowerCase().includes(query.toLowerCase()));
  return <ScrollView style={s.page} contentContainerStyle={s.wrap}>
    <Text style={s.title}>Cari Jasa</Text>
    <Text style={s.sub}>Pilih kategori bantuan yang Anda perlukan.</Text>
    <TextInput style={s.search} placeholder="Cari kategori jasa..." value={query} onChangeText={setQuery} />
    {shown.map(item => <Pressable key={item.name} style={s.card} onPress={() => router.push({ pathname: "/request", params: { category: item.name } })}>
      <Text style={s.icon}>{item.icon}</Text><View style={{flex:1}}><Text style={s.name}>{item.name}</Text><Text style={s.detail}>{item.detail}</Text></View><Text style={s.arrow}>›</Text>
    </Pressable>)}
    {shown.length === 0 && <Text style={s.sub}>Kategori tidak ditemukan.</Text>}
    <Pressable style={s.back} onPress={() => router.replace("/home")}><Text style={s.backText}>← Kembali ke Beranda</Text></Pressable>
  </ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f5f7fb"},wrap:{padding:20,paddingBottom:35},title:{fontSize:27,fontWeight:"900",color:"#172033",marginTop:18},sub:{color:"#667085",marginTop:7,marginBottom:17,lineHeight:21},search:{backgroundColor:"#fff",borderRadius:13,padding:14,borderWidth:1,borderColor:"#e5e9f0",marginBottom:12,fontSize:15},card:{backgroundColor:"#fff",borderRadius:15,padding:16,marginTop:10,flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"#edf0f5"},icon:{fontSize:28,marginRight:14},name:{fontSize:16,fontWeight:"800",color:"#172033"},detail:{fontSize:12,color:"#7b8492",marginTop:4},arrow:{fontSize:27,color:"#98a2b3"},back:{padding:18,alignItems:"center",marginTop:10},backText:{color:"#344054",fontWeight:"700"}});
