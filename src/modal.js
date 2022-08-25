import {
  bind, view, unmount, render, listeners, attributes, classes,
} from 'somedom';

export const tag = bind(render, listeners(), attributes({
  class: classes,
}));

export function mountOverlay(overlay, slider) {
  let container;
  let maximum;
  let clicked;
  function set() {
    slider.current.style.transform = `translateY(${scrollY}px)`;
  }

  function sync() {
    container = overlay.current.parentNode.offsetWidth;
    maximum = Math.min(document.body.clientWidth, container);
    slider.current.style.left = `${(maximum / 2) - (slider.current.offsetWidth / 2)}px`;
    overlay.current.style.width = `${maximum / 2}px`;
  }

  function slide(x) {
    overlay.current.style.width = `${x}px`;
    slider.current.style.left = `${overlay.current.offsetWidth - (slider.current.offsetWidth / 2)}px`;
  }

  function getCursorPos(e) {
    const a = overlay.current.getBoundingClientRect();

    let x = (e || window.event).pageX - a.left;
    x -= window.pageXOffset;

    return x;
  }

  let moving;
  let t;
  function clickUp() {
    if (!moving) {
      moving = true;
      document.body.classList.add('moving');
    }

    clearTimeout(t);
    t = setTimeout(() => {
      if (moving) {
        moving = false;
        document.body.classList.remove('moving');
      }
    }, 1260);
  }

  function slideMove(e) {
    clearTimeout(t);

    let pos;
    if (!clicked) {
      clickUp();
      return false;
    }

    pos = getCursorPos(e);

    if (pos < 0) pos = 0;
    if (pos > container) pos = container;

    slide(pos);
  }

  function slideReady(e) {
    e.preventDefault();
    clicked = 1;
  }

  function slideFinish() {
    clickUp();
    clicked = 0;
  }

  sync();
  slider.current.addEventListener('mousedown', slideReady);
  slider.current.addEventListener('touchstart', slideReady);
  addEventListener('mouseup', slideFinish);
  addEventListener('touchstop', slideFinish);
  addEventListener('mousemove', slideMove);
  addEventListener('touchmove', slideMove);
  addEventListener('resize', sync);
  addEventListener('scroll', set);

  return {
    set width(value) {
      slide(value);
    },
    get width() {
      return parseInt(overlay.current.style.width, 10);
    },
    update() {
      clickUp();
    },
    teardown() {
      slider.current.removeEventListener('mousedown', slideReady);
      slider.current.removeEventListener('touchstart', slideReady);
      removeEventListener('mouseup', slideFinish);
      removeEventListener('touchstop', slideFinish);
      removeEventListener('mousemove', slideMove);
      removeEventListener('touchmove', slideMove);
      removeEventListener('resize', sync);
      removeEventListener('scroll', set);
      unmount(slider.current);
    },
  };
}

export function openModal(offsetKey, images) {
  let overlay;
  let modal;
  let top;
  function onClose(onKeys) {
    window.removeEventListener('keydown', onKeys);

    document.body.style.overflow = '';

    if (overlay) {
      overlay.teardown();
      overlay = null;
    }

    modal.unmount();
    scrollTo({ behavior: 'instant', left: 0, top });
  }

  function testKeys(e) {
    if (e.keyCode === 9) {
      e.preventDefault();
      if (e.shiftKey) modal.prev(e);
      else modal.next(e);
      overlay.update();
    }

    if (e.keyCode === 37 || e.keyCode === 39) {
      e.preventDefault();
      if (e.keyCode === 37) modal.left(e);
      if (e.keyCode === 39) modal.right(e);
      overlay.update();
    }

    if (e.keyCode === 32) {
      e.preventDefault();
      modal.change();
      overlay.update();
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

  function scaleImage(img) {
    return { width: img.width / img.dpi, height: img.height / img.dpi };
  }

  function scaleOverlay(img) {
    return [
      `width:${img.width / img.dpi}px;height:${img.height / img.dpi}px`,
      (img.width / img.dpi) < document.body.clientWidth ? `;right:0` : '',
      (img.height / img.dpi) < document.body.clientHeight ? `;bottom:0` : '',
    ].join('');
  }

  window.addEventListener('keydown', testKeys);

  const overlayRef = {};
  const sliderRef = {};

  const app = view(({ key, diff }) => {
    const current = images[key];
    const props = scaleImage(current);

    return ['.noop.modal', {
      onclick: closeModal,
      style: scaleOverlay(current),
      oncreate(el) {
        requestAnimationFrame(() => el.classList.add('ready'));
      },
    },
      ['.container', null, [
        ['.layer', null, [
          ['img.a', { src: current.images.actual, ...props }],
        ]],
        ['.layer.overlay', { ref: overlayRef }, [
          ['img.b', { src: current.images.base, ...props }],
        ]],
        ['.slider', { ref: sliderRef }],
        ['span.right', null, [
          ['small', null, ['b', null, `${current.label} ${current.width / current.dpi}x${current.height / current.dpi} (${key + 1}/${images.length})`]],
          ['button.close', { onclick: () => closeModal() }, '×'],
        ]],
        diff ? ['.layer.difference', null, [
          ['img.c', { src: current.images.out, ...props }],
        ]] : null,
      ]],
    ];
  }, {
    diff: true,
    key: offsetKey,
  }, {
    next: e => ({ key }) => ({ key: key < images.length - 1 ? Math.min(key + 1, images.length - 1) : 0 }),
    prev: e => ({ key }) => ({ key: key > 0 ? Math.max(key - 1, 0) : images.length - 1 }),
    left: e => () => {
      overlay.width = Math.max(0, overlay.width - (!e.shiftKey ? 100 : 10));
    },
    right: e => ({ key }) => {
      overlay.width = Math.min(images[key].width, overlay.width + (!e.shiftKey ? 100 : 10));
    },
    change: () => ({ diff }) => ({ diff: !diff }),
  });

  top = scrollY;
  modal = app(document.body, tag);
  overlay = mountOverlay(overlayRef, sliderRef);
  scrollTo({ behavior: 'instant', left: 0, top: 0 });
}
