/* global window, document */

import { mount } from 'somedom';
import { tag, openModal } from './modal';

const appScript = document.getElementById('app');
const images = JSON.parse(appScript.innerHTML);

appScript.parentNode.removeChild(appScript);

function ImageItem(props, key) {
  return ['li', [
    ['strong', props.label],
    ['.flex', [
      ['img.noop', { src: props.thumbnails.base }],
      ['img.noop', { src: props.thumbnails.actual }],
      ['.info', { class: props.ok ? 'passed' : 'failed' }, [
        ['h3', props.ok ? 'It passed.' : 'It did not passed'],
        ['h2', `Diff: ${props.diff}%`],
        ['button.noop', { onclick: () => openModal(key, true, images) }, 'Open diff'],
        ['button.noop', { onclick: () => openModal(key, false, images) }, 'Compare'],
      ]],
    ]],
  ]];
}

function ImageList() {
  if (!images.length) {
    return ['ul', [['li', 'No differences to report']]];
  }

  return ['ul', images.map((x, key) => ImageItem(x, key))];
}

mount([ImageList], tag);
