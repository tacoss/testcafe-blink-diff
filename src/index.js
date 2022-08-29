import { mount } from 'somedom';
import { tag, openModal } from './modal';

const appScript = document.getElementById('app');
const images = JSON.parse(appScript.innerHTML);

appScript.parentNode.removeChild(appScript);

function ImageItem(props, key) {
  return ['li', null, [
    ['strong', null, props.label],
    ['.flex', null, [
      ['img.noop', { src: props.thumbnails.base }],
      ['img.noop', { src: props.thumbnails.actual }],
      ['.info', { class: props.ok ? 'passed' : 'failed' }, [
        ['h3', null, props.ok ? 'It passed.' : 'It did not passed'],
        ['h2', null, props.diff > 0 ? `Diff: ${props.diff}%` : 'No differences'],
        ['button.noop', { onclick: () => openModal(key, images) }, 'Compare'],
      ]],
    ]],
  ]];
}

function ImageList() {
  return !images.length
    ? ['ul', null, [['li', null, 'No differences to report']]]
    : ['ul', null, images.map((x, key) => ImageItem(x, key))];
}

mount([ImageList], tag);
