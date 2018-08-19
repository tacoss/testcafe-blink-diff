/* global window, document */

import { view, mount } from 'somedom';

const appScript = document.getElementById('app');
const images = JSON.parse(appScript.innerHTML);

appScript.parentNode.removeChild(appScript);

function ui(overlay, onClose) {
  const w = overlay.offsetWidth;
  const h = overlay.offsetHeight;

  let clicked;

  overlay.style.width = `${w / 2}px`;

  const widget = view(overlay.parentNode, null, [
    ['div', { ref: 'slider', class: 'slider' }],
    ['button', { class: 'close', click: onClose }, '&times;'],
  ]);

  const { slider } = widget.$refs;

  slider.style.top = `${(h / 2) - (slider.offsetHeight / 2)}px`;
  slider.style.left = `${(w / 2) - (slider.offsetWidth / 2)}px`;

  function slide(x) {
    overlay.style.width = `${x}px`;
    slider.style.left = `${overlay.offsetWidth - (slider.offsetWidth / 2)}px`;
  }

  function getCursorPos(e) {
    const a = overlay.getBoundingClientRect();

    let x = (e || window.event).pageX - a.left;

    x -= window.pageXOffset;

    return x;
  }

  function slideMove(e) {
    let pos;

    if (!clicked) {
      return false;
    }

    pos = getCursorPos(e);

    if (pos < 0) {
      pos = 0;
    }

    if (pos > w) {
      pos = w;
    }

    slide(pos);
  }

  function slideReady(e) {
    e.preventDefault();
    clicked = 1;

    window.addEventListener('mousemove', slideMove);
    window.addEventListener('touchmove', slideMove);
  }

  function slideFinish() {
    clicked = 0;
  }

  slider.addEventListener('mousedown', slideReady);
  slider.addEventListener('touchstart', slideReady);
  window.addEventListener('mouseup', slideFinish);
  window.addEventListener('touchstop', slideFinish);

  return {
    teardown() {
      slider.removeEventListener('mousedown', slideReady);
      slider.removeEventListener('touchstart', slideReady);
      window.removeEventListener('mouseup', slideFinish);
      window.removeEventListener('touchstop', slideFinish);
      window.removeEventListener('mousemove', slideMove);
      window.removeEventListener('touchmove', slideMove);
      widget.$destroy();
    },
  };
}

function openModal(imageInfo, asDiff) {
  let overlay;
  let modal;

  function onClose(callback) {
    window.removeEventListener('keyup', callback);

    document.body.style.overflow = '';

    if (overlay) {
      overlay.teardown();
    }

    modal.$destroy();
  }

  function closeCheck(e) {
    if (e.keyCode === 27) {
      onClose(closeCheck);
    }
  }

  function closeModal(e) {
    if (!e || e.target === modal.$node) {
      onClose(closeCheck);
    }
  }

  window.addEventListener('keyup', closeCheck);

  modal = view('div', { class: 'modal', click: closeModal }, [
    ['div', { class: 'container', style: `width:${imageInfo.width}px` },
      asDiff
        ? [
          ['img', { src: imageInfo.images.out }],
          ['button', { class: 'close', click: () => closeModal() }, '&times;'],
        ] : [
          ['div', { class: 'layer' }, [
            ['img', { src: imageInfo.images.base }],
          ]],
          ['div', { ref: 'overlay', class: 'layer overlay' }, [
            ['img', { src: imageInfo.images.actual }],
          ]],
        ],
    ],
  ]);

  mount(modal);

  document.body.style.overflow = 'hidden';

  if (!asDiff) {
    overlay = ui(modal.$refs.overlay, onClose);
  }
}

function ImageItem(props) {
  return ['li', null, [
    ['strong', null, props.label],
    ['div', { class: 'flex' }, [
      ['img', { src: props.thumbnails.base }],
      ['img', { src: props.thumbnails.actual }],
      ['div', { class: `info ${props.ok ? 'passed' : 'failed'}` }, [
        ['h3', null, props.ok ? 'It passed.' : 'It did not passed'],
        ['h2', null, `Diff: ${props.diff}%`],
        ['button', { click: () => openModal(props, true) }, 'Open diff'],
        ['button', { click: () => openModal(props) }, 'Compare'],
      ]],
    ]],
  ]];
}

function ImageList() {
  if (!images.length) {
    return ['div', null, 'No differences to report'];
  }

  return ['ul', null, images.map(ImageItem)];
}

mount(view(ImageList));
