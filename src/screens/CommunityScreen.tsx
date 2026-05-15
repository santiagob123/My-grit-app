import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Image, FlatList, RefreshControl, Dimensions,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Flame, MessageCircle, Send, Users, Shield, Zap, Info, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useSocialStore } from '../store/useSocialStore';
import { useUserStore } from '../store/useUserStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const PostCard = ({ post, onHype, C }: any) => {
  return (
    <Animated.View 
      entering={FadeInDown} 
      layout={Layout.springify()}
      style={[styles.postCard, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}
    >
      <View style={styles.postHeader}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: C.accent + '20' }]}>
          <Text style={{ fontWeight: '800', color: C.accent }}>{post.username[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.postUsername, { color: C.textPrimary }]}>{post.username}</Text>
            <View style={[styles.rankBadge, { backgroundColor: C.warning + '20' }]}>
              <Text style={{ color: C.warning, fontSize: 10, fontWeight: '900' }}>RANGO {post.grade}</Text>
            </View>
          </View>
          <Text style={[styles.postMeta, { color: C.textMuted }]}>Nivel {post.level} • Guerrero Grit</Text>
        </View>
        <Text style={[styles.postTime, { color: C.textDisabled }]}>
          {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <Text style={[styles.postContent, { color: C.textSecondary }]}>{post.content}</Text>

      <View style={styles.postFooter}>
        <TouchableOpacity 
          onPress={() => onHype(post.id)} 
          style={[styles.hypeBtn, post.has_hyped && { backgroundColor: C.accent + '15' }]}
        >
          <Flame size={18} color={post.has_hyped ? C.accent : C.textMuted} fill={post.has_hyped ? C.accent : 'transparent'} />
          <Text style={[styles.hypeCount, { color: post.has_hyped ? C.accent : C.textMuted }]}>
            {post.hype_count} HYPE
          </Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1 }} />
        
        <View style={styles.typeBadge}>
          <Zap size={12} color={C.textDisabled} />
          <Text style={{ color: C.textDisabled, fontSize: 10, fontWeight: '800', marginLeft: 4 }}>
            {post.type.toUpperCase()}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const CommunityScreen = () => {
  const C = useTheme();
  const { posts, loading, fetchPosts, createPost, toggleHype } = useSocialStore();
  const { name } = useUserStore();
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    await createPost(newPost);
    setNewPost('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleHype = (id: string) => {
    toggleHype(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerSub, { color: C.textMuted }]}>TRIBU DE GUERREROS</Text>
            <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Comunidad</Text>
          </View>
          <View style={[styles.statsBadge, { backgroundColor: C.card, borderColor: C.border }]}>
            <Users size={16} color={C.accent} />
            <Text style={{ color: C.textPrimary, fontWeight: '800', marginLeft: 6 }}>1.2k</Text>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PostCard post={item} onHype={handleHype} C={C} />
            )}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchPosts} tintColor={C.accent} />
            }
            ListHeaderComponent={
              <View style={[styles.inputCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: C.accent + '20' }]}>
                    <Text style={{ fontWeight: '800', color: C.accent }}>{name ? name[0].toUpperCase() : 'G'}</Text>
                  </View>
                  <TextInput
                    placeholder="Reporta tu avance, Guerrero..."
                    placeholderTextColor={C.textDisabled}
                    style={[styles.input, { color: C.textPrimary }]}
                    multiline
                    value={newPost}
                    onChangeText={setNewPost}
                  />
                </View>
                <View style={styles.inputFooter}>
                   <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.inputTool}>
                        <TrendingUp size={16} color={C.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.inputTool}>
                        <Shield size={16} color={C.textMuted} />
                      </TouchableOpacity>
                   </View>
                   <TouchableOpacity 
                    onPress={handlePost}
                    disabled={!newPost.trim()}
                    style={[styles.sendBtn, { backgroundColor: newPost.trim() ? C.accent : C.border }]}
                   >
                     <Send size={18} color="#FFF" />
                     <Text style={{ color: '#FFF', fontWeight: '800', marginLeft: 8 }}>PUBLICAR</Text>
                   </TouchableOpacity>
                </View>
              </View>
            }
          />
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 20 
  },
  headerSub: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  statsBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1 
  },
  inputCard: { 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    marginBottom: 25 
  },
  avatarPlaceholder: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '600', 
    minHeight: 40, 
    paddingTop: 10 
  },
  inputFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 20, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#00000008' 
  },
  inputTool: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#00000005', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  sendBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12 
  },
  postCard: { 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    marginBottom: 16 
  },
  postHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 15 
  },
  postUsername: { fontSize: 15, fontWeight: '800' },
  rankBadge: { 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  },
  postMeta: { fontSize: 12, fontWeight: '600' },
  postTime: { fontSize: 11, fontWeight: '700' },
  postContent: { 
    fontSize: 16, 
    lineHeight: 24, 
    fontWeight: '500', 
    marginBottom: 20 
  },
  postFooter: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  hypeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12, 
    gap: 8, 
    backgroundColor: '#00000005' 
  },
  hypeCount: { fontSize: 11, fontWeight: '900' },
  typeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    backgroundColor: '#00000005' 
  },
});
