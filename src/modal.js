import {
  bind, view, mount, unmount, render, listeners, attributes, classes,
} from 'somedom';

export const tag = bind(render, listeners(), attributes({
  class: classes,
}));

export function mountOverlay(overlay) {
  let w;
  let h;
  let clicked;

  const slider = mount(overlay.parentNode, ['div', { class: 'slider' }], tag);

  function sync() {
    w = overlay.parentNode.offsetWidth;
    h = overlay.parentNode.offsetHeight;

    overlay.style.width = `${w / 2}px`;

    slider.style.left = `${(w / 2) - (slider.offsetWidth / 2)}px`;
    slider.style.top = `${(h / 2) - (slider.offsetHeight / 2)}px`;
  }

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

  sync();

  slider.addEventListener('mousedown', slideReady);
  slider.addEventListener('touchstart', slideReady);
  window.addEventListener('mouseup', slideFinish);
  window.addEventListener('touchstop', slideFinish);

  return {
    set width(value) {
      slide(value);
    },
    get width() {
      return parseInt(overlay.style.width, 10);
    },
    update() {
      sync();
    },
    teardown() {
      slider.removeEventListener('mousedown', slideReady);
      slider.removeEventListener('touchstart', slideReady);
      window.removeEventListener('mouseup', slideFinish);
      window.removeEventListener('touchstop', slideFinish);
      window.removeEventListener('mousemove', slideMove);
      window.removeEventListener('touchmove', slideMove);
      unmount(slider);
    },
  };
}

export function openModal(offsetKey, asDiff, images) {
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
    if (e.keyCode === 37) modal.prev(e);
    if (e.keyCode === 39) modal.next(e);

    if (e.keyCode === 32) {
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
    return mountOverlay(document.querySelector('.overlay'));
  }

  function syncOverlay() {
    if (overlay) {
      overlay.update();
    }
  }

  function scaleImage(img) {
    if (img.width > screen.width || img.height > screen.height) {
      return { width: img.width / 2, height: img.height / 2 };
    }
  }

  function scaleOverlay(img) {
    if (img.width > screen.width || img.height > screen.height) {
      return 'width:100%;height:100%';
    }

    return `width:${img.width}px;height:${img.height}px`;
  }

  window.addEventListener('keyup', testKeys);

  const app = view(({ key, diff }) => ['.noop.modal', { onclick: closeModal }, [
    ['.container', { style: scaleOverlay(images[key]), onupdate: syncOverlay },
      (diff
        ? [
          ['img', { src: images[key].images.out, ...scaleImage(images[key]) }],
        ] : [
          ['.layer', null, [
            ['img.a', { src: images[key].images.actual, ...scaleImage(images[key]) }],
          ]],
          ['.layer.overlay', null, [
            ['img.b', { src: images[key].images.base, ...scaleImage(images[key]) }],
          ]],
        ])
        .concat([
          ['button.close', { onclick: () => closeModal() }, '×'],
        ]),
    ],
  ]], {
    diff: asDiff,
    key: offsetKey,
  }, {
    next: e => ({ key, diff }) => {
      if (!diff && e.shiftKey) {
        overlay.width = Math.min(images[key].width, overlay.width + (images[key].width * 0.25));
        return;
      }

      return {
        key: Math.min(key + 1, images.length - 1),
      };
    },
    prev: e => ({ key, diff }) => {
      if (!diff && e.shiftKey) {
        overlay.width = Math.max(0, overlay.width - (images[key].width * 0.25));
        return;
      }

      return {
        key: Math.max(key - 1, 0),
      };
    },
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
