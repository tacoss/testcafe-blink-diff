/* global window, document */

const appScript = document.getElementById('app');
const images = JSON.parse(appScript.innerHTML);

function push(target, ...nodes) {
  nodes.forEach(source => {
    target.appendChild(source);
  });
}

function tag(name, attrs, content) {
  const target = document.createElement(name);

  if (attrs) {
    Object.keys(attrs).forEach(k => {
      if (typeof attrs[k] === 'function') {
        target.addEventListener(k, attrs[k]);
      } else {
        target.setAttribute(k, attrs[k]);
      }
    });
  }

  if (content) {
    if (!Array.isArray(content)) {
      target.innerHTML = content;
    } else {
      push(target, ...content);
    }
  }

  return target;
}

function ui(img, onClose) {
  const w = img.offsetWidth;
  const h = img.offsetHeight;

  let clicked;

  img.style.width = `${w / 2}px`;

  const slider = tag('div', { class: 'slider' });

  push(img.parentElement, slider);

  slider.style.top = `${(h / 2) - (slider.offsetHeight / 2)}px`;
  slider.style.left = `${(w / 2) - (slider.offsetWidth / 2)}px`;

  function slide(x) {
    img.style.width = `${x}px`;
    slider.style.left = `${img.offsetWidth - (slider.offsetWidth / 2)}px`;
  }

  function getCursorPos(e) {
    const a = img.getBoundingClientRect();

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

  push(img.parentElement, tag('button', { class: 'close', click: onClose }, '&times;'));

  slider.addEventListener('mousedown', slideReady);
  window.addEventListener('mouseup', slideFinish);
  slider.addEventListener('touchstart', slideReady);
  window.addEventListener('touchstop', slideFinish);

  return {
    teardown() {
      slider.removeEventListener('mousedown', slideReady);
      window.removeEventListener('mouseup', slideFinish);
      slider.removeEventListener('touchstart', slideReady);
      window.removeEventListener('touchstop', slideFinish);

      window.addEventListener('mousemove', slideMove);
      window.addEventListener('touchmove', slideMove);
    },
  };
}

const div = tag('div');
const ul = tag('ul');

images.forEach(imageInfo => {
  const diffDetails = tag('div', { class: `info ${imageInfo.ok ? 'passed' : 'failed'}` });
  const isOK = tag('h3', null, imageInfo.ok ? 'It passed.' : 'It did not passed!');
  const diff = tag('h2', null, `Diff: ${imageInfo.diff}%`);

  function openModal(asDiff) {
    let overlay;
    let modal;

    function onClose() {
      if (overlay) {
        overlay.teardown();
      }

      document.body.removeChild(modal);
      document.body.style.overflow = '';
    }

    modal = tag('div', {
      class: 'modal',
      click(e) {
        if (e.target === modal) {
          onClose();
        }
      },
    }, [
      tag('div', { class: 'container', style: `width:${imageInfo.width}px` },
        asDiff
          ? [
            tag('img', { src: imageInfo.images.out }),
            tag('button', { class: 'close', click: onClose }, '&times;'),
          ] : [
            tag('div', { class: 'layer' }, [
              tag('img', { src: imageInfo.images.base }),
            ]),
            tag('div', { class: 'layer overlay' }, [
              tag('img', { src: imageInfo.images.actual }),
            ]),
          ],
      ),
    ]);

    document.body.style.overflow = 'hidden';
    push(document.body, modal);

    if (!asDiff) {
      overlay = ui(document.getElementsByClassName('overlay')[0], onClose);
    }
  }

  const open = tag('button', { click: () => openModal(true) }, 'Open diff');
  const compare = tag('button', { click: () => openModal() }, 'Compare');

  push(diffDetails, isOK, diff, open, compare);

  const actualImg = tag('img', { src: imageInfo.thumbnails.actual });
  const baseImg = tag('img', { src: imageInfo.thumbnails.base });

  const li = tag('li');
  const flex = tag('div', { class: 'flex' });

  push(flex, baseImg, actualImg, diffDetails);

  const title = tag('strong', null, imageInfo.label);

  push(li, title, flex);
  push(ul, li);
});

push(div, ul);

appScript.parentNode.appendChild(div);
appScript.parentNode.removeChild(appScript);
