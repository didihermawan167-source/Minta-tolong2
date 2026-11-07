import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
export default function Payments(){
 return <ScrollView style={s.page} contentContainerStyle={s.wrap}>
  <Text style={s.title}>Pembayaran & Komisi</Text>
  <Text style={s.sub}>Aturan rancangan transaksi Minta Tolong.</Text>
  <View style={s.card}><Text style={s.kicker}>KOMISI PLATFORM</Text><Text style={s.percent}>10%</Text><Text style={s.body}>Dipotong dari upah penyedia jasa, bukan biaya tambahan yang ditagihkan kepada pengguna.</Text></View>
  <Text style={s.heading}>Alur pembayaran</Text>
  {["Pengguna menyepakati harga jasa dengan penyedia.","Pengguna membayar melalui metode pembayaran resmi platform.","Pekerjaan diselesaikan dan dikonfirmasi.","Komisi 10% dipotong; sisa 90% menjadi hak penyedia jasa."].map((v,i)=><View key={i} style={s.step}><Text style={s.number}>{i+1}</Text><Text style={s.body}>{v}</Text></View>)}
  <View style={s.notice}><Text style={s.noticeTitle}>Status: rancangan, belum aktif</Text><Text style={s.body}>Belum ada uang yang diproses atau dipotong. Fitur transaksi baru boleh diaktifkan setelah integrasi penyedia pembayaran, keamanan, dan pencatatan transaksi selesai diuji.</Text></View>
  <Pressable style={s.back} onPress={()=>router.replace("/home")}><Text>Kembali ke Beranda</Text></Pressable>
 </ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f5f7fb"},wrap:{padding:20,paddingBottom:35},title:{fontSize:26,fontWeight:"900",color:"#172033",marginTop:18},sub:{color:"#667085",marginTop:7,marginBottom:18},card:{backgroundColor:"#fff",padding:20,borderRadius:17,borderWidth:1,borderColor:"#edf0f5"},kicker:{fontSize:11,fontWeight:"900",color:"#667085",letterSpacing:1},percent:{fontSize:42,fontWeight:"900",color:"#e53935",marginTop:4},body:{fontSize:13,color:"#667085",lineHeight:20,flex:1},heading:{fontSize:17,fontWeight:"900",color:"#172033",marginTop:24,marginBottom:8},step:{backgroundColor:"#fff",padding:14,borderRadius:13,marginTop:9,flexDirection:"row",alignItems:"center",gap:12},number:{backgroundColor:"#eaf3ff",color:"#1757a6",fontWeight:"900",width:30,height:30,textAlign:"center",textAlignVertical:"center",borderRadius:10,overflow:"hidden"},notice:{backgroundColor:"#fff4df",padding:15,borderRadius:13,marginTop:20,gap:7},noticeTitle:{fontWeight:"900",color:"#8a5200"},back:{alignItems:"center",padding:18,marginTop:10}});
