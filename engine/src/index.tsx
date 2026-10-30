import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {MusicVideo,ModelSheet} from './MV';
import {FPS,FRAMES} from './timing';
const Root=()=> <>
 <Composition id="PaperMemories" component={MusicVideo} width={1920} height={1080} fps={FPS} durationInFrames={FRAMES} defaultProps={{showLyrics:true,withSfx:true}}/>
 <Composition id="CharacterStudy" component={ModelSheet} width={1920} height={1080} fps={FPS} durationInFrames={1}/>
 </>;
registerRoot(Root);
