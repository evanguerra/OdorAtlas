const DATA_URL = 'data/pca_data.json';

let resizeObserver = null;
let bgData = null;

function buildDom(container) {
  container.innerHTML = `
    <div class="intro-scene-wrap">
      <svg class="intro-scene__bg" id="s0-bg-svg"></svg>

      <div class="intro-scene">
        <div>
          <h1 class="intro-scene__title">Odor Space Atlas</h1>
          <p class="intro-scene__desc">
            This visualization explores the Arctander dataset which contains160 odor stimuli were rated by
            panelists across 146 descriptors for example "floral," "sour," or "musty". This visualization walks through
            what those ratings look like when reduced to a 2D map, how individual descriptors shift with concentration,
            and how a handful of molecules move through that space as they get stronger. It's a short,
            four-part guided tour with each part building on the last.
          </p>
        </div>

        <div class="intro-grid">
          <div class="intro-card">
            <p class="intro-card__label">Getting around</p>
            <p>
              Use the <strong>Next / Back</strong> buttons or the
              <span class="intro-kbd">&larr;</span> <span class="intro-kbd">&rarr;</span>
              arrow keys to move between the four scenes. The dots at the
              bottom show where you are.
            </p>
          </div>
          <div class="intro-card">
            <p class="intro-card__label">The "Details" box</p>
            <p>
              At the top of every scene, this box tells you exactly what
              you're looking at. It updates live as you hover or click things
              below.
            </p>
          </div>
          <div class="intro-card">
            <p class="intro-card__label">Hover &amp; click</p>
            <p>
              Points and bars are interactive: hover or click them for more information.
            </p>
          </div>
          <div class="intro-card">
            <p class="intro-card__label">Low vs. high concentration</p>
            <p>
              A few molecules were rated at multiple concentrations. The same molecule can smell
              very differently depending on how much of it you're smelling.
            </p>
          </div>
          <div class="intro-card intro-card--wide">
            <p class="intro-card__label">Zooming into one molecule</p>
            <p>
              In the third scene, clicking any molecule's line or its point
              in the legend opens a drill-down look at that molecule.
              From there, use the <strong>Back to atlas</strong> link (or
              press <span class="intro-kbd">Esc</span>) to return to exactly
              where you left off.
            </p>
          </div>
        </div>

        <p class="intro-scene__cta">Click "Next" (or press &rarr;) to begin.</p>
      </div>
    </div>
  `;
}

function renderBackground(container) {
  if (typeof d3 === 'undefined' || !bgData) return;

  const svgEl = container.querySelector('#s0-bg-svg');
  if (!svgEl) return;

  const wrapEl = container.querySelector('.intro-scene-wrap');
  const width = wrapEl.clientWidth;
  const height = wrapEl.clientHeight;

  const svg = d3.select(svgEl).attr('viewBox', `0 0 ${width} ${height}`);

  const margin = { top: 40, right: 60, bottom: 40, left: 60 };
  const innerW = Math.max(10, width - margin.left - margin.right);
  const innerH = Math.max(10, height - margin.top - margin.bottom);

  const pc1Extent = d3.extent(bgData.points, (d) => d.pc1);
  const pc2Extent = d3.extent(bgData.points, (d) => d.pc2);
  const padX = (pc1Extent[1] - pc1Extent[0]) * 0.08;
  const padY = (pc2Extent[1] - pc2Extent[0]) * 0.08;

  const x = d3.scaleLinear()
    .domain([pc1Extent[0] - padX, pc1Extent[1] + padX])
    .range([0, innerW]);
  const y = d3.scaleLinear()
    .domain([pc2Extent[0] - padY, pc2Extent[1] + padY])
    .range([innerH, 0]);

  const mwExtent = d3.extent(bgData.points.filter((d) => d.molecular_weight != null), (d) => d.molecular_weight);
  const colorScale = d3.scaleSequential()
    .domain(mwExtent)
    .interpolator(d3.interpolateRgb('#2F6F8F', '#D8912F'));

  const intensityExtent = d3.extent(bgData.points, (d) => d.mean_intensity);
  const radiusScale = d3.scaleSqrt().domain(intensityExtent).range([3, 13]);

  let g = svg.select('g.intro-bg-points');
  if (g.empty()) g = svg.append('g').attr('class', 'intro-bg-points');
  g.attr('transform', `translate(${margin.left},${margin.top})`);

  const circles = g.selectAll('circle.intro-bg-point')
    .data(bgData.points, (d) => d.stimulus);

  circles.exit().remove();

  circles.enter()
    .append('circle')
    .attr('class', 'intro-bg-point')
    .merge(circles)
    .attr('cx', (d) => x(d.pc1))
    .attr('cy', (d) => y(d.pc2))
    .attr('r', (d) => radiusScale(d.mean_intensity))
    .attr('fill', (d) => (d.has_molecule_record ? colorScale(d.molecular_weight) : 'var(--accent-magenta)'));
}

function init(container) {
  buildDom(container);

  fetch(DATA_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
      return res.json();
    })
    .then((json) => {
      bgData = json;
      renderBackground(container);
    })
    .catch((err) => {
      console.error('Scene 0 background failed to load:', err);
    });

  resizeObserver = new ResizeObserver(() => renderBackground(container));
  resizeObserver.observe(container.querySelector('.intro-scene-wrap'));
}

function destroy() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  bgData = null;
}

export default { id: 'scene0', shortTitle: 'Overview', init, destroy };
