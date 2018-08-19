/* global somedom, window, document */

const appScript = document.getElementById('app');
const images = JSON.parse(appScript.innerHTML);

appScript.parentNode.removeChild(appScript);

const { view, mount } = somedom;

function ui(overlay, onClose) {
  const w = overlay.offsetWidth;
  const h = overlay.offsetHeight;

  let clicked;

  overlay.style.width = `${w / 2}px`;

  const widget = view(overlay.parentNode, null, [
    ['div', { ref: 'slider', class: 'slider' }],
    ['button', { class: 'close', click: onClose }, '&times;'],
  ]);

  const { slider } = widget.refs;

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
      widget.destroy();
    },
  };
}

function openModal(imageInfo, asDiff) {
  let overlay;
  let modal;

  function onClose() {
    document.body.style.overflow = '';

    if (overlay) {
      overlay.teardown();
    }

    modal.destroy();
  }

  function closeModal(e) {
    if (e.target === modal.node) {
      onClose();
    }
  }

  function closeCheck(e) {
    if (e.keyCode === 27) {
      onClose();
      window.removeEventListener('keyup', closeCheck);
    }
  }

  window.addEventListener('keyup', closeCheck);

  modal = view('div', { class: 'modal', click: closeModal }, [
    ['div', { class: 'container', style: `width:${imageInfo.width}px` },
      asDiff
        ? [
          ['img', { src: imageInfo.images.out }],
          ['button', { class: 'close', click: onClose }, '&times;'],
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
    overlay = ui(modal.refs.overlay, onClose);
  }
}

function ImageList() {
  if (!images.length) {
    return ['div', null, 'No differences to report'];
  }

  return ['ul', null, images.map(imageInfo => {
    return ['li', null, [
      ['strong', null, imageInfo.label],
      ['div', { class: 'flex' }, [
        ['img', { src: imageInfo.thumbnails.base }],
        ['img', { src: imageInfo.thumbnails.actual }],
        ['div', { class: `info ${imageInfo.ok ? 'passed' : 'failed'}` }, [
          ['h3', null, imageInfo.ok ? 'It passed.' : 'It did not passed!'],
          ['h2', null, `Diff: ${imageInfo.diff}%`],
          ['button', { click: () => openModal(imageInfo, true) }, 'Open diff'],
          ['button', { click: () => openModal(imageInfo) }, 'Compare'],
        ]],
      ]],
    ]];
  })];
}

mount(view(ImageList));
