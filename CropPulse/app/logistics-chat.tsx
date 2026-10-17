/**
 * LogisticsChatScreen — Group chat conversation for shared transport participants.
 */

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useFadeIn } from "@/hooks/useFadeIn";
import { spacing, typography, radius } from "@/constants/theme";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import {
  useLogistics,
  useLogisticsRequest,
  useIsParticipant,
  useLogisticsMessages,
} from "@/context/LogisticsContext";
import { formatRoute, formatMessageTime } from "@/utils/logistics";

export default function LogisticsChatScreen() {
  const { colors } = useTheme();
  const { opacity, translateY } = useFadeIn(40);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { joinChat, sendMessage } = useLogistics();
  const { user } = useAuth();
  const { request } = useLogisticsRequest(id || "");
  const { isParticipant } = useIsParticipant(id || "");
  const messages = useLogisticsMessages(id || "");

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    if (!id || !isParticipant) return;
    let disposed = false;
    let leave: (() => void) | undefined;
    void joinChat(id).then((cleanup) => {
      if (disposed) cleanup();
      else leave = cleanup;
    }).catch((error: unknown) => {
      if (!disposed) setChatError(error instanceof Error ? error.message : "Could not connect to group chat");
    });
    return () => {
      disposed = true;
      leave?.();
    };
  }, [id, isParticipant, joinChat]);

  // Group messages chronologically
  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!id) return;
    const content = inputText.trim();
    try {
      await sendMessage(id, content);
      setInputText("");
      setChatError("");
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Message could not be sent");
    }
  };

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        <Header title="Not Found" showBack onBack={() => router.back()} />
        <View style={styles.errorCenter}>
          <Text style={{ color: colors.onSurface }}>Transport group not found.</Text>
          <Button label="Go Back" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isParticipant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        <Header title="Access Denied" showBack onBack={() => router.back()} />
        <View style={styles.errorCenter}>
          <MaterialCommunityIcons name="lock-outline" size={48} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.onSurface }]}>Private Conversation</Text>
          <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
            Only farmers participating in this logistics group can access and view the chat history.
          </Text>
          <Button label="Request to Join" onPress={() => router.push(`/logistics-detail?id=${request.id}` as any)} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const routeLabel = formatRoute(request.pickupLocation, request.destination);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={[styles.headerWrap, { borderBottomColor: colors.outlineVariant }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {request.crop} Transport Group
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {routeLabel} · {request.preferredTime}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(`/logistics-detail?id=${request.id}` as any)}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={sortedMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isSelf = item.senderId === user?.id;
              return (
                <View style={[styles.messageRow, isSelf ? styles.messageRowSelf : styles.messageRowOther]}>
                  {!isSelf && (
                    <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {item.senderName.split(" ").map((n: string) => n[0]).join("")}
                      </Text>
                    </View>
                  )}
                  <View style={styles.messageBubbleWrap}>
                    {!isSelf && (
                      <Text style={[styles.senderName, { color: colors.onSurfaceVariant }]}>
                        {item.senderName}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.bubble,
                        isSelf
                          ? [styles.bubbleSelf, { backgroundColor: colors.primary }]
                          : [styles.bubbleOther, { backgroundColor: colors.surfaceVariant }],
                      ]}
                    >
                      <Text style={[styles.messageText, isSelf ? { color: colors.onPrimary } : { color: colors.onSurface }]}>
                        {item.message}
                      </Text>
                    </View>
                    <Text style={[styles.messageTime, isSelf ? styles.timeSelf : styles.timeOther, { color: colors.onSurfaceVariant }]}>
                      {formatMessageTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyCenter}>
                <MaterialCommunityIcons name="forum-outline" size={48} color={colors.onSurfaceVariant} />
                <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>Welcome to Group Chat!</Text>
                <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  This is the private group conversation for the coordinating farmers. Ask questions, plan times, or split costs here!
                </Text>
              </View>
            }
          />

          {/* Chat Input Bar */}
          {chatError ? (
            <Text accessibilityRole="alert" style={[styles.chatError, { color: colors.danger }]}>
              {chatError}
            </Text>
          ) : null}
          <View style={[styles.inputBar, { borderTopColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.placeholder}
              style={[styles.textInput, { color: colors.onSurface, backgroundColor: colors.surfaceVariant }]}
              multiline
            />
            <Pressable
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceVariant },
              ]}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={inputText.trim() ? colors.onPrimary : colors.placeholder}
              />
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { ...typography.title },
  headerSubtitle: { ...typography.caption, marginTop: 1 },
  errorCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  errorTitle: { ...typography.title, marginTop: spacing.md },
  errorText: { ...typography.bodySm, textAlign: "center", marginTop: spacing.xs },
  messageList: { padding: spacing.lg, paddingBottom: spacing.md },
  messageRow: { flexDirection: "row", marginBottom: spacing.md, maxWidth: "80%" },
  messageRowSelf: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  messageRowOther: { alignSelf: "flex-start" },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  avatarText: { fontSize: 11, fontWeight: "700" },
  messageBubbleWrap: { marginLeft: spacing.sm, marginRight: spacing.sm, alignItems: "flex-start" },
  senderName: { ...typography.caption, marginBottom: 2, fontWeight: "600" },
  bubble: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleSelf: { borderBottomRightRadius: 2 },
  bubbleOther: { borderBottomLeftRadius: 2 },
  messageText: { ...typography.bodySm, lineHeight: 18 },
  messageTime: { fontSize: 9, marginTop: 2 },
  timeSelf: { alignSelf: "flex-end" },
  timeOther: { alignSelf: "flex-start" },
  emptyCenter: { padding: spacing.xl, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyTitle: { ...typography.title, marginTop: spacing.md },
  emptyText: { ...typography.bodySm, textAlign: "center", marginTop: spacing.xs, lineHeight: 18 },
  chatError: { ...typography.caption, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    ...typography.bodySm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
