/* global window, document */

import {
  bind, view, mount, render, unmount, listeners,
} from 'somedom';

const appScript = document.getElementById('app');
const images = JSON.parse(appScript.innerHTML);

appScript.parentNode.removeChild(appScript);

const tag = bind(render, listeners());

function ui(overlay, onClose) {
  const w = overlay.offsetWidth;
  const h = overlay.offsetHeight;

  let clicked;

  overlay.style.width = `${w / 2}px`;

  const widget = mount(overlay.parentNode, ['div', [
    ['div', { class: 'slider' }],
    ['button', { class: 'close', onclick: onClose }, '×'],
  ]], tag);

  const slider = document.querySelector('.slider');

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
      unmount(widget);
    },
  };
}

function openModal(offsetKey, asDiff) {
  let overlay;
  let modal;

  function onClose(callback) {
    window.removeEventListener('keyup', callback);

    document.body.style.overflow = '';

    if (overlay) {
      overlay.teardown();
    }

    modal.unmount();
  }

  function testKeys(e) {
    if (e.keyCode === 37) modal.prev();
    if (e.keyCode === 39) modal.next();

    if (e.keyCode === 9) {
      e.preventDefault();
      modal.change();
    }

    if (e.keyCode === 27) {
      onClose(testKeys);
    }
  }

  function closeModal(e) {
    if (!e || e.target === modal.target) {
      onClose(testKeys);
    }
  }

  function addOverlay() {
    return ui(document.querySelector('.overlay'), onClose);
  }

  window.addEventListener('keyup', testKeys);

  const app = view(({ key, diff }) => ['div', { class: 'noop modal', onclick: closeModal }, [
    ['div', { class: 'container', style: `width:${images[key].width}px;height:${images[key].height}px` },
      (diff
        ? [
          ['img', { src: images[key].images.out }],
        ] : [
          ['div', { class: 'layer' }, [
            ['img', { src: images[key].images.actual }],
          ]],
          ['div', { class: 'layer overlay' }, [
            ['img', { src: images[key].images.base }],
          ]],
        ])
        .concat([
          ['button', { class: 'close', onclick: () => closeModal() }, '×'],
        ]),
    ],
  ]], {
    diff: asDiff,
    key: offsetKey,
  }, {
    next: () => state => ({
      key: Math.min(state.key + 1, images.length - 1),
    }),
    prev: () => state => ({
      key: Math.max(state.key - 1, 0),
    }),
    change: () => ({ diff }) => {
      if (overlay) {
        overlay.teardown();
        overlay = null;
      } else if (diff) {
        setTimeout(() => {
          overlay = addOverlay();
        });
      }

      return {
        diff: !diff,
      };
    },
  });

  modal = app(document.body, tag);

  document.body.style.overflow = 'hidden';

  if (!asDiff) {
    overlay = addOverlay();
  }
}

function ImageItem(props, key) {
  return ['li', [
    ['strong', props.label],
    ['div', { class: 'flex' }, [
      ['img', { class: 'noop', src: props.thumbnails.base }],
      ['img', { class: 'noop', src: props.thumbnails.actual }],
      ['div', { class: `info ${props.ok ? 'passed' : 'failed'}` }, [
        ['h3', props.ok ? 'It passed.' : 'It did not passed'],
        ['h2', `Diff: ${props.diff}%`],
        ['button', { class: 'noop', onclick: () => openModal(key, true) }, 'Open diff'],
        ['button', { class: 'noop', onclick: () => openModal(key) }, 'Compare'],
      ]],
    ]],
  ]];
}

function ImageList() {
  if (!images.length) {
    return ['div', 'No differences to report'];
  }

  return ['ul', images.map((x, key) => ImageItem(x, key))];
}

mount([ImageList], tag);
