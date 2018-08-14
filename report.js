/* global window, document */

const appScript = document.getElementById('app');
const images = JSON.parse(appScript.innerHTML);

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
    target.innerHTML = content;
  }

  return target;
}

const div = tag('div');
const ul = tag('ul');

images.forEach(imageInfo => {
  const diffDetails = tag('div', { class: imageInfo.ok ? 'passed' : 'failed' });
  const isOK = tag('h3', null, imageInfo.ok ? 'It passed.' : 'It did not passed!');
  const diff = tag('h2', null, `Score: ${imageInfo.diff}`);

  function click() {
    window.open(imageInfo.images.out);
  }

  const open = tag('button', { click }, 'Open diff');

  diffDetails.appendChild(isOK);
  diffDetails.appendChild(diff);
  diffDetails.appendChild(open);

  const actualImg = tag('img', { src: imageInfo.thumbnails.actual });
  const baseImg = tag('img', { src: imageInfo.thumbnails.base });

  const li = tag('li');

  li.appendChild(baseImg);
  li.appendChild(actualImg);
  li.appendChild(diffDetails);

  ul.appendChild(li);
});

div.appendChild(ul);

appScript.parentNode.appendChild(div);
appScript.parentNode.removeChild(appScript);
