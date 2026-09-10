import React from 'react';
import { BookOpen, AlertCircle, Target, Globe } from 'lucide-react';
import { Button } from '@/shared/ui';

export default function StageTabs({ activeTab, onTabChange }) {
  return (
    <div className="stage-tabs" role="tablist">
      <Button 
        variant="ghost"
        className={`stage-tab ${activeTab === 'story' ? 'active' : ''}`} 
        onClick={() => onTabChange('story')}
        role="tab"
        aria-selected={activeTab === 'story'}
        label="Visual Story"
      >
        <BookOpen size={16} /> Visual Story
      </Button>
      <Button 
        variant="ghost"
        className={`stage-tab ${activeTab === 'mistakes' ? 'active' : ''}`} 
        onClick={() => onTabChange('mistakes')}
        role="tab"
        aria-selected={activeTab === 'mistakes'}
        label="Mistakes"
      >
        <AlertCircle size={16} /> Mistakes
      </Button>
      <Button 
        variant="ghost"
        className={`stage-tab ${activeTab === 'challenge' ? 'active' : ''}`} 
        onClick={() => onTabChange('challenge')}
        role="tab"
        aria-selected={activeTab === 'challenge'}
        label="Challenge"
      >
        <Target size={16} /> Challenge
      </Button>
      <Button 
        variant="ghost"
        className={`stage-tab ${activeTab === 'data' ? 'active' : ''}`} 
        onClick={() => onTabChange('data')}
        role="tab"
        aria-selected={activeTab === 'data'}
        label="Real World"
      >
        <Globe size={16} /> Real World
      </Button>
    </div>
  );
}
