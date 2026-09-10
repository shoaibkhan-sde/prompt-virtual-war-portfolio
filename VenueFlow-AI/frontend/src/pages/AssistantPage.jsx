import React from 'react';
import AssistantChat from '../components/AssistantChat';

export default function AssistantPage({ messages, setMessages }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <AssistantChat messages={messages} setMessages={setMessages} />
      </div>
    </div>
  );
}
