import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Dimensions, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Trophy, Medal, Zap, Crown, User, TrendingUp } from 'lucide-react-native';
import { supabase } from '../api/supabase';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');

interface Warrior {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
}

export const LeaderboardScreen = () => {
  const C = useTheme();
  const { session } = useAuthStore();
  const [warriors, setWarriors] = useState<Warrior[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar, level, xp')
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .limit(20);

      if (!error && data) {
        setWarriors(data as Warrior[]);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const topThree = warriors.slice(0, 3);
  const others = warriors.slice(3);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchLeaderboard} tintColor={C.accent} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerSub, { color: C.textMuted }]}>SISTEMA SOCIAL</Text>
            <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Ranking Global</Text>
          </View>

          {/* Podium Section */}
          <View style={styles.podiumContainer}>
            {topThree[1] && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, { borderColor: '#C0C0C0' }]}>
                  <Text style={{ fontSize: 36 }}>{topThree[1].avatar}</Text>
                  <View style={[styles.podiumRank, { backgroundColor: '#C0C0C0' }]}>
                    <Text style={styles.podiumRankText}>2</Text>
                  </View>
                </View>
                <Text style={[styles.podiumName, { color: C.textPrimary }]} numberOfLines={1}>{topThree[1].name}</Text>
                <View style={styles.podiumLevel}>
                  <Zap size={10} color={C.warning} fill={C.warning} />
                  <Text style={[styles.podiumLevelText, { color: C.textMuted }]}>LVL {topThree[1].level}</Text>
                </View>
              </Animated.View>
            )}

            {topThree[0] && (
              <Animated.View entering={FadeInUp.delay(100)} style={[styles.podiumItem, styles.podiumCenter]}>
                <Crown color="#FFD700" size={24} style={{ marginBottom: 4 }} />
                <View style={[styles.podiumAvatar, styles.podiumAvatarLarge, { borderColor: '#FFD700' }]}>
                  <Text style={{ fontSize: 48 }}>{topThree[0].avatar}</Text>
                  <View style={[styles.podiumRank, styles.podiumRankLarge, { backgroundColor: '#FFD700' }]}>
                    <Text style={styles.podiumRankText}>1</Text>
                  </View>
                </View>
                <Text style={[styles.podiumName, { color: C.textPrimary, fontSize: 16 }]} numberOfLines={1}>{topThree[0].name}</Text>
                <View style={styles.podiumLevel}>
                  <Zap size={12} color={C.warning} fill={C.warning} />
                  <Text style={[styles.podiumLevelText, { color: C.textMuted, fontSize: 12 }]}>LVL {topThree[0].level}</Text>
                </View>
              </Animated.View>
            )}

            {topThree[2] && (
              <Animated.View entering={FadeInDown.delay(300)} style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, { borderColor: '#CD7F32' }]}>
                  <Text style={{ fontSize: 36 }}>{topThree[2].avatar}</Text>
                  <View style={[styles.podiumRank, { backgroundColor: '#CD7F32' }]}>
                    <Text style={styles.podiumRankText}>3</Text>
                  </View>
                </View>
                <Text style={[styles.podiumName, { color: C.textPrimary }]} numberOfLines={1}>{topThree[2].name}</Text>
                <View style={styles.podiumLevel}>
                  <Zap size={10} color={C.warning} fill={C.warning} />
                  <Text style={[styles.podiumLevelText, { color: C.textMuted }]}>LVL {topThree[2].level}</Text>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Others List */}
          <View style={styles.listContainer}>
            {others.map((warrior, index) => {
              const isMe = warrior.id === session?.user?.id;
              return (
                <Animated.View 
                  key={warrior.id} 
                  entering={FadeInDown.delay(400 + index * 50)}
                  style={[
                    styles.warriorRow, 
                    { backgroundColor: C.card, borderColor: isMe ? C.accent : C.border },
                    isMe && { borderWidth: 1.5, shadowColor: C.accent, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }
                  ]}
                >
                  <Text style={[styles.rankText, { color: C.textMuted }]}>{index + 4}</Text>
                  <View style={[styles.avatarCircle, { backgroundColor: C.background }]}>
                    <Text style={{ fontSize: 20 }}>{warrior.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.warriorName, { color: C.textPrimary }]}>
                      {warrior.name} {isMe && "(TÚ)"}
                    </Text>
                    <View style={styles.warriorStats}>
                      <Text style={[styles.statText, { color: C.textMuted }]}>Guerrero de Élite</Text>
                    </View>
                  </View>
                  <View style={styles.levelBadge}>
                    <TrendingUp size={12} color={C.accent} style={{ marginRight: 4 }} />
                    <Text style={[styles.levelText, { color: C.accent }]}>LVL {warrior.level}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          {warriors.length === 0 && !isLoading && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <User size={48} color={C.textDisabled} strokeWidth={1} />
              <Text style={{ color: C.textMuted, marginTop: 12, textAlign: 'center' }}>Aún no hay guerreros en el ranking. ¡Sé el primero!</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 24, marginBottom: 30 },
  headerSub: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 40, height: 220 },
  podiumItem: { alignItems: 'center', width: (width - 60) / 3 },
  podiumCenter: { width: (width - 60) / 2.5, zIndex: 10 },
  podiumAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)', position: 'relative' },
  podiumAvatarLarge: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  podiumRank: { position: 'absolute', bottom: -10, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  podiumRankLarge: { width: 30, height: 30, borderRadius: 15, bottom: -12 },
  podiumRankText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  podiumName: { fontSize: 13, fontWeight: '700', marginTop: 15, textAlign: 'center', width: '90%' },
  podiumLevel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  podiumLevelText: { fontSize: 10, fontWeight: '800' },
  listContainer: { paddingHorizontal: 20, gap: 12 },
  warriorRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, borderWidth: 1, gap: 12 },
  rankText: { fontSize: 14, fontWeight: '900', width: 25, textAlign: 'center' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  warriorName: { fontSize: 15, fontWeight: '700' },
  warriorStats: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statText: { fontSize: 11, fontWeight: '500' },
  levelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(10, 132, 255, 0.1)' },
  levelText: { fontSize: 12, fontWeight: '800' },
});
