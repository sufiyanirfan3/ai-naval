import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Beatloader from "react-spinners/BeatLoader";

import {
  Box,
  Button,
  HStack,
  Heading,
  Icon,
  Text,
  Textarea,
  VStack,
  useToast,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";
import { handleEnterKeyPress } from "@/utils";
import NameInput from "@/components/NameInput";
import { Message } from "@/types";

function Home() {

  // storing array messages in state
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // tracking user input
  const [text, setText] = useState("");

  // function to execute api request and communicate with open ai, pinecone & eleven labs
  const askAi = async (props?: { name?: string }) => {
    if (!text && !props?.name)
      return toast({
        title: "Enter text to translate first!",
        status: "error",
      });

    if (!userName && !props?.name)
      return toast({
        title: "Enter your name first!",
        status: "error",
      });

    const message = { role: "user", content: text };

    if (!props?.name) {
      addMessage({ role: "user", content: text });
      setText("");
    }

    setLoading(true);

    const reqBody = {
      messages: props?.name ? undefined : [...messages, message],
      userName: userName || props?.name,
    };

    console.log("api reqBody:", reqBody);

    // response for chat gpt
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Accept: "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    const jsonResp = await response.json();

    console.log("api jsonResp response:", jsonResp);

    setLoading(false);

    const { translatedText } = jsonResp;

    addMessage({ role: "assistant", content: translatedText });

    setText("");

    try {
      setLoading(false);
    } catch (e: any) {
      console.log("Error:", e.message);
    }
  };

  const userBgColor = useColorModeValue("blue.500", "blue.300");
  const assistantBgColor = useColorModeValue("gray.100", "gray.700");
  const userColor = "white";
  const assistantColor = "black";

  const [userName, setUserName] = useState<null | string>(null);

  const assistantName = "Salesforce";

  return (
    <>
      <Head>
        <title>AI Bot</title>
      </Head>
      <VStack pt={40} px={4} mb={100} spacing={4} maxW="600px" mx="auto">
        <Heading as="h1" color="black">
          AI Chatbot That Gives Answer on trained documents
        </Heading>
        <Text color="black" as="i" fontSize="xs">
          Start a conversation with Salesforce Chat.{" "}
        </Text>

        {!userName ? (
          <NameInput
            onEnter={(name) => {
              setUserName(name);
              askAi({ name });
            }}
          />
        ) : (
          <>
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <Box
                  key={index}
                  alignSelf={isUser ? "flex-end" : "flex-start"}
                  backgroundColor={isUser ? userBgColor : assistantBgColor}
                  color={isUser ? userColor : assistantColor}
                  borderRadius="lg"
                  px={4}
                  py={2}
                  maxWidth="70%"
                  position="relative"
                >
                  <Text
                    fontSize="xs"
                    position="absolute"
                    color="black"
                    top={-4}
                    left={isUser ? "auto" : 2}
                    right={isUser ? 1 : 0}
                    width="max-content"
                  >
                    {isUser ? userName : assistantName}
                  </Text>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--chakra-fonts-body)",
                    }}
                  >
                    <Text fontSize="sm">{message.content}</Text>
                  </pre>
                </Box>
              );
            })}
            <VStack w="100%" spacing={4}>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleEnterKeyPress(() => {
                  askAi();
                })}
              />
            </VStack>

            <HStack w="100%" spacing={4}>
              <Button
                h={9}
                variant="outline"
                onClick={() => {
                  askAi();

                  window.scrollTo({
                    left: 0,
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                isLoading={loading}
                spinner={<Beatloader size={8} />}
              >
                Send
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </>
  );
}

export default Home;
