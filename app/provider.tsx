import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { router } from "expo-router";

const skills = ["Perbaikan motor","Perbaikan elektronik","Kebersihan rumah","Angkut barang","Kurir / antar","Teknisi HP & komputer","Pertukangan","Perawatan kebun"];
export default function Provider() {
  const [selected,setSelected]=useState<string[]>([]);
  const [experience,setExperience]=useState("");
  const [area,setArea]=useState("");
  const toggle=(v:string)=>setSelected(old=>old.includes(v)?old.filter(x=>x!==v):[...old,v]);
  const submit=()=>{ if(!selected.length || !experience.trim() || !area.trim()){Alert.alert("Belum lengkap","Pilih keahlian, isi pengalaman, dan wilayah layanan.");return;} Alert.alert("Belum tersimpan","Formulir penyedia jasa masih prototipe. Data belum dikirim atau disimpan ke server."); };
  return <ScrollView style={s.page} contentContainerStyle={s.wrap}>
    <Text style={s.title}>Daftar Jadi Penyedia Jasa</Text>
    <Text style={s.sub}>Daftarkan keahlian agar pengguna dapat menemukan dan menghubungi Anda.</Text>
    <Text style={s.label}>Pilih keahlian</Text>
    <View style={s.skills}>{skills.map(v=><Pressable key={v} onPress={()=>toggle(v)} style={[s.chip,selected.includes(v)&&s.chipOn]}><Text style={[s.chipText,selected.includes(v)&&s.chipTextOn]}>{selected.includes(v)?"✓ ":""}{v}</Text></Pressable>)}</View>
    <Text style={s.label}>Pengalaman / keterangan</Text><TextInput value={experience} onChangeText={setExperience} multiline placeholder="Contoh: pengalaman servis motor 3 tahun" style={[s.input,s.multi]}/>
    <Text style={s.label}>Wilayah layanan</Text><TextInput value={area} onChangeText={setArea} placeholder="Contoh: Kecamatan ..." style={s.input}/>
    <View style={s.info}><Text style={s.infoTitle}>Komisi rancangan: 10%</Text><Text style={s.infoText}>Belum ada biaya pendaftaran atau pemotongan uang. Persentase ini belum aktif sebagai transaksi.</Text></View>
    <Pressable style={s.button} onPress={submit}><Text style={s.buttonText}>PERIKSA FORMULIR</Text></Pressable>
    <Pressable style={s.back} onPress={()=>router.replace("/home")}><Text>Kembali ke Beranda</Text></Pressable>
  </ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f5f7fb"},wrap:{padding:20,paddingBottom:35},title:{fontSize:25,fontWeight:"900",color:"#172033",marginTop:18},sub:{color:"#667085",lineHeight:21,marginTop:8,marginBottom:18},label:{fontWeight:"800",color:"#344054",marginTop:14,marginBottom:9},skills:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{backgroundColor:"#fff",borderWidth:1,borderColor:"#dfe4ec",paddingVertical:10,paddingHorizontal:12,borderRadius:20},chipOn:{backgroundColor:"#eaf3ff",borderColor:"#2367b7"},chipText:{fontSize:12,color:"#475467"},chipTextOn:{color:"#1757a6",fontWeight:"800"},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#dfe4ec",borderRadius:12,padding:13,fontSize:14},multi:{height:95,textAlignVertical:"top"},info:{backgroundColor:"#fff4df",padding:15,borderRadius:13,marginTop:20},infoTitle:{fontWeight:"900",color:"#8a5200",fontSize:15},infoText:{color:"#795b2a",fontSize:12,lineHeight:19,marginTop:6},button:{backgroundColor:"#e53935",padding:16,borderRadius:12,alignItems:"center",marginTop:20},buttonText:{color:"#fff",fontWeight:"900"},back:{padding:18,alignItems:"center"}});
