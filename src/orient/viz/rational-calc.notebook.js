md`# Proofs Tradeoff Report

1. Calculator may contain errors and definitely TODOs
2. Adding new graphs is easy
3. Fixing errors or change construction is easy
`

viewof config = {
  const form = formToObject(html`
<form>
  <div><input type=range name=post_lambda min=1 max=128 step=1 value=10> <i>post_lambda</i></div>
</form>`)
  return form
}

md`## Filters`

// Window size MiB
window_size_mib_choices = [4, 64, 128, 1024, 16384, 32768]
viewof window_size_mib_config = checkbox({
  title: "Window Sizes",
  options: window_size_mib_choices.map(d => ({value: d, label: d})),
  value: window_size_mib_choices,
})

md`#### Vars that matter`

viewof decoding_time_parallel_weight = number({value: 1})
viewof proofs_per_block_weight = number({value: 1})
viewof epost_time_parallel_weight = number({value: 1})

table_constraints(solved_many, [
  'proof_name',
  'graph_name',
  'window_size_mib',
  'decoding_time_parallel',
  'proofs_per_block_kib',
  'epost_time_parallel',
  'utility',
], [], 'utility')

md`## Graphs`
md`### On-chain footprint

This graphshows the average proofs per block (assuming a network size of ${filecoin.filecoin_storage_capacity_eib}EiB)
`

viewof proofs_per_block_kib_ruler = chooser(solved_many, 'proofs_per_block_kib', 2000)
bar_chart(solved_many, 'proofs_per_block_kib', [
  'seals_size_per_block_kib',
  'posts_size_per_block_kib',
], ['proof_name', 'graph_name', 'window_size_mib'], {filter: d => d < Math.pow(10, proofs_per_block_kib_ruler)})

md`### Retrieval`

viewof decoding_time_parallel_ruler = chooser(solved_many, 'decoding_time_parallel', 2)

bar_chart(solved_many, 'decoding_time_parallel', [
  'encoding_window_time_parallel',
  'window_read_time_parallel',
], ['proof_name', 'graph_name', 'window_size_mib'], {
  filter: d => d < Math.pow(10, decoding_time_parallel_ruler),
  yrule: Math.pow(10, decoding_time_parallel_ruler)
})

viewof decoding_time_ruler = chooser(solved_many, 'decoding_time', 16)

bar_chart(solved_many, 'decoding_time', [
  'encoding_window_time',
  'window_read_time',
], ['proof_name', 'graph_name', 'window_size_mib'], {filter: d => d < Math.pow(10, decoding_time_ruler)})


// table_constraints(solved_many, [
//   'proof_name',
//   'graph_name',
//   'window_size_mib',
//   'decoding_time_parallel',
//   'encoding_window_time_parallel',
//   'window_read_time_parallel'
// ], [])

md`### PoRep`

viewof porep_time_parallel_ruler = chooser(solved_many, 'porep_time_parallel', 12 * 60 * 60)

bar_chart(solved_many, 'porep_time_parallel', [
  'porep_snark_time_parallel',
  'porep_commit_time_parallel',
  'encoding_time_parallel'
], ['proof_name', 'graph_name', 'window_size_mib'], {filter: d => d < Math.pow(10, porep_time_parallel_ruler)})

bar_chart(solved_many, 'porep_commit_time', [
  'commr_time',
  'commq_time',
  'commc_time'
], ['proof_name', 'graph_name', 'window_size_mib'])

bar_chart(solved_many, 'commc_time', [
  'commc_tree_time',
  'commc_leaves_time',
], ['proof_name', 'graph_name', 'window_size_mib'])

md`### EPoSt`

viewof epost_time_parallel_ruler = chooser(solved_many, 'epost_time_parallel', 30)

bar_chart(solved_many, 'epost_time_parallel', [
  'epost_leaves_read_parallel',
  'epost_mtree_read_parallel',
  // 'epost_data_access_parallel',
  'post_ticket_gen',
  'epost_inclusions_time_parallel',
  'post_snark_time_parallel'
], ['proof_name', 'graph_name', 'window_size_mib'], {filter: d => d < Math.pow(10, epost_time_parallel_ruler)})

table_constraints(solved_many, [
  'proof_name',
  'graph_name',
  'window_size_mib',
  'epost_time_parallel',
  'epost_data_access_parallel',
  'epost_mtree_read_parallel',
  'epost_leaves_read_parallel',
  'post_ticket_gen',
  'epost_inclusions_time_parallel',
  'post_snark_time_parallel',
  'post_challenges',
  'post_challenge_read',
  'windows'
], [])

md`### Merkle tree caching`


graph_constraints(mtree_solved, 'post_mtree_layers_cached', 'epost_time_parallel', ['proof_name'], { height: 100, yrule: 15 })
graph_constraints(mtree_solved, 'post_mtree_layers_cached', 'post_inclusion_time', ['proof_name'], { height: 100 })

md`### Impact of \`chung_delta\` in StackedChung`
queries = [...Array(8)].map((_, i) => {
  const query = Object.assign(
    {},
    constants,
    stackedChungParams,
    { chung_delta: 0.01 * (i+1) },
    { window_size_mib: 128 }
  )

  return [
    Object.assign({}, query, stackedReplicas),
    Object.assign({}, query, wrapper),
    Object.assign({}, query, wrapperVariant),
  ]
}).flat()

delta_solved = (await solve_many(queries)).map(d => d[0])

// graph_constraints(delta_solved, 'chung_delta', 'stacked_layers', [], { height: 100 })
// graph_constraints(delta_solved, 'chung_delta', 'porep_challenges', [], { height: 100 })
// graph_constraints(delta_solved, 'chung_delta', 'post_challenges', [], { height: 100 })
graph_constraints(delta_solved, 'chung_delta', 'decoding_time_parallel', ['proof_name'], {yrule: 0.5, height: 100})
graph_constraints(delta_solved, 'chung_delta', 'epost_time_parallel', ['proof_name'], {yrule: 10, height: 100})
graph_constraints(delta_solved, 'chung_delta', 'porep_proof_size_kib', ['proof_name'], { height: 100 })
graph_constraints(delta_solved, 'chung_delta', 'block_size_kib', ['proof_name'], { height: 100 })
graph_constraints(delta_solved, 'chung_delta', 'onboard_tib_time_days', ['proof_name'], { height: 100 })
graph_constraints(delta_solved, 'chung_delta', 'porep_time_parallel', ['proof_name'], { height: 100 })
plot3d(delta_solved, 'chung_delta', 'epost_time_parallel', 'onboard_tib_time_days')
md`---`

md`### Parameters`

base = ({
  "porep_lambda": 10,
  "post_mtree_layers_cached": 25,
  "post_lambda": 10,
  "sector_size_gib": 32,
  "window_size_mib": 1024,
  "wrapper_parents": 100,
  "!StackedReplicaUnaligned": true
})

md`### Constants`

md`#### Graph`

stackedChungParams = ({
  "graph_name": "Chung",
  "!StackedChungParameters": true,
  "chung_delta": 0.01,
  "expander_parents": 16
})

stackedSDRParams = ({
  "graph_name": "SDR",
  "!StackedSDRParameters": true,
  "sdr_delta": 0.01
})

md`#### Proofs`

wrapper = ({
  "proof_name": "wrapping",
  "!ElectionWithFallbackPoSt": true,
  "!VectorR": true,
  "!Wrapping": true,
})

wrapperVariant = ({
  "proof_name": "wrappingVariant",
  "!ElectionWithFallbackPoSt": true,
  "!VectorR": true,
  "!WrappingVariant": true,
})

stackedReplicas = ({
  "proof_name": "stackedReplicas",
  "!ElectionWithFallbackPoSt": true,
  "!SectorEncoding": true,
  "!VectorR": true,
  "!StackedReplicas": true
})

md`#### Protocol`

filecoin = ({
  "ec_e": 5,
  "fallback_period_days": 1,
  "fallback_ratio": 0.05,
  "filecoin_reseals_per_year": 1,
  "filecoin_storage_capacity_eib": 1,
  "node_size": 32,
  "polling_time": 15,
  "cost_amax": 1,
  "hashing_amax": 2,
  "spacegap": 0.2,
  "proofs_block_fraction": 0.3,
  "epost_challenged_sectors_fraction": 0.04,
})

md`### Miner`

md`#### Hardware Config`

rig = ({
  "rig_cores": 16,
  "rig_snark_parallelization": 2,
  "rig_malicious_cost_per_year": 2.5,
  "rig_ram_gib": 32,
  "rig_storage_latency": 0.003,
  "rig_storage_min_tib": 100,
  "rig_storage_parallelization": 16,
  "rig_storage_read_mbs": 80,
  "cost_gb_per_month": 0.0025,
  "extra_storage_time": 0,
  "hash_gb_per_second": 5,
})

md`#### Benchmarks`

bench = ({
  "column_leaf_hash_time": 2.56e-7,
  "kdf_time": 1.28e-8,
  "merkle_tree_datahash_time": 1.28e-8,
  "merkle_tree_hash_time": 2.56e-7,
  "snark_constraint_time": 0.000004642,
  "ticket_hash": 2.56e-7,
})

md`### SNARKs`

constraints = ({
  "merkle_tree_hash_constraints": 1376,
  "ticket_constraints": 1376,
  "merkle_tree_datahash_constraints": 56000,
  "kdf_constraints": 25000,
  "column_leaf_hash_constraints": 1376,
  "snark_size": 192,
  "porep_snark_partition_constraints": 100000000,
  "post_snark_partition_constraints": 3000000,
})

md`---`


md`#### Other important vars`

table_constraints(solved_many, [
  'proof_name',
  'graph_name',
  'window_size_mib',
  'decoding_time_parallel',
  'porep_time_parallel',
  'porep_proof_size_kib',
  'block_size_kib',
  'epost_time_parallel',
], [])

md`#### Graphs`
// table_constraints(solved_many, [
//   'proof_name',
//   'graph_name',
//   'window_size_mib',
//   'porep_lambda',
//   'porep_challenges',
//   'post_lambda',
//   'post_challenges',
//   'stacked_layers',
//   'expander_parents',
//   'drg_parents',
//   'windows',
//   'window_size_mib',
//   'sector_size_gib',
// ], [])

md`#### PoRep`
// table_constraints(solved_many, [
//   'proof_name',
//   'graph_name',
//   'window_size_mib',
//   'encoding_time',
//   'encoding_time_parallel',
//   'porep_commit_time',
//   'porep_commit_time_parallel',
//   'porep_snark_time',
//   'porep_snark_time_parallel',
//   'porep_proof_size',
//   'porep_snark_constraints',
//   'porep_time'
// ], [])

md`#### PoSt`
// table_constraints(solved_many, [
//   'proof_name',
//   'graph_name',
//   'window_size_mib',
//   'post_proof_size',
//   'post_snark_constraints',
//   'post_snark_time',
//   'post_snark_time_parallel',
//   'post_time',
//   'post_time_parallel',
//   'post_inclusions_time',
//   'post_inclusions_time_parallel',
//   'post_data_access',
//   'post_data_access_parallel'
// ], [])

md`#### EPoSt`
// table_constraints(solved_many, [
//   'proof_name',
//   'graph_name',
//   'window_size_mib',
//   'epost_time',
//   'epost_time_parallel',
//   'epost_inclusions_time',
//   'epost_inclusions_time_parallel',
//   'epost_data_access',
//   'epost_data_access_parallel'
// ], [])

md`## Debug`
// report_from_result(solved_many[0], combos[0])
// report_from_result(solved_many[1], combos[1])
// report_from_result(solved_many[2], combos[2])
// report_from_result(solved_many[3], combos[3])
// report_from_result(solved_many[4], combos[4])
// report_from_result(solved_many[5], combos[5])

md`---`
md`## Dev`

md`### Vars`
constants = Object.assign({}, base, constraints, filecoin, bench, rig)

combos = {
  let start = [constants]
  let proofs = extend_query(start, [wrapperVariant, wrapper, stackedReplicas])
  let graphs = extend_query(proofs, [stackedChungParams, stackedSDRParams])
  let query = extend_query(graphs, window_size_mib_choices.map(d => ({window_size_mib: +d})))

  return query
}

createJsonDownloadButton(combos)

solved_many_pre = (await solve_many(combos)).map(d => d[0])
  .map(d => {
    d.construction = `${d.graph_name}_${d.proof_name}`
    return d
  })

utility_function = (x1, x2, x3, w1, w2, w3) => w1 * x1 + w2 * x2 + w3 * x3


solved_many = solved_many_pre
  .filter(d => window_size_mib_config.some(c => d['window_size_mib'] === +c))
  .map(d => {
    const utility = utility_function(
      d['decoding_time_parallel'],
      d['proofs_per_block_kib'],
      d['epost_time_parallel'],
      decoding_time_parallel_weight,
      proofs_per_block_weight,
      epost_time_parallel_weight
    )
    return Object.assign({}, d, {utility: utility})
  })
// solved_manys = (await solve_manys(combos)).flat()

createJsonDownloadButton(solved_many)

mtree_query = {
  let query = [constants]
  const proofs = [wrapper, wrapperVariant, stackedReplicas]
  const post_mtree_layers_cached = [...Array(10)].map((_, i) => ({post_mtree_layers_cached: i+20}))

  query = extend_query(query, proofs, post_mtree_layers_cached, [stackedChungParams])

  return query
}

mtree_solved = (await solve_many(mtree_query)).map(d => d[0])


md`### Orient`

function dump_vars() {
  return fetch(orientServer + '/dump-vars')
    .then(response => response.json())
    .then(json => {

      const map = {}
      json.forEach(d => {
        map[d.name] = d
      })

      return map
    })
}

vars = dump_vars()

function solve_multiple(json) {
  return fetch(orientServer + '/solve', {
    body: JSON.stringify(json),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST'
  }).then(res => {
    return res.json()
  }).then(res => {
    return res.map(d => {
      const results = {}
      Object.keys(res[0])
        .filter(d => !d.includes('%'))
        .map(d => {
          results[d] = res[0][d]
        })
      return results
    })
  })
}

function solve_manys(json) {
  return fetch(orientServer + '/solve-many', {
    body: JSON.stringify(json),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST'
  }).then(res => {
    return res.json()
  }).then(res => {
    return res.flat().map(d => {
      const results = {}
      Object.keys(res[0])
        .filter(d => !d.includes('%'))
        .map(d => {
          results[d] = res[0][d]
        })
      return results
    })
  })
}

function solve_many(json) {
  return Promise.all(json.map(j => solve(j)))
}

function solve(json) {
  return fetch(orientServer + '/solve', {
    body: JSON.stringify(json),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST'
  }).then(res => {
    return res.json()
  }).then(res => {
    const results = {}
    Object.keys(res[0])
      .filter(d => !d.includes('%'))
      .map(d => {
        results[d] = res[0][d]
      })
    return results
  })
}

orientServer = `http://${window.location.hostname}:8000`

md`### Orientable`

function report_from_result(result, starting_assignments, simplify_terms) {
  const html = md`

| name | val |
| ---- | --- |
${Object.keys(result).sort()
  .map(d => `| ${!starting_assignments[d] ? `**${d}**` : d} | ${result[d]} |\n`)}
`
  html.value = result
  return html
}

bar_chart = (raw, title, variables, group_by, opts) => {
  let data = raw
      .map(d => {
        return variables.map(key => ({
          construction: group_by.map(g => `${d[g]}`).join(', '),
          type: key,
          value: d[key],
          title: d[title]
        }))
      })
      .flat()
  let discarded_data = []
  let organized_data = []

  if (opts && opts.filter) {
    organized_data = data.filter(d => opts.filter(d['title']))
    discarded_data = data.filter(d => !opts.filter(d['title']))
  }
  let graph = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "title": `Composition of ${title} (${vars[title].type || ''})`,
    vconcat: [
      {
        layer: [{
          "width": 800,
          "mark": "bar",
          "data": { values: organized_data },
          "encoding": {
            "x": {"aggregate": "sum", "field": "value", "type": "quantitative"},
            "y": {"field": "construction", "type": "nominal"},
            "color": {"field": "type", "type": "nominal"}
          }
        }]
      },
      {
        "mark": "bar",
        "width": 800,
        "title": "Data filtered out",
        "data": { values: discarded_data },
        "encoding": {
          "x": {"aggregate": "sum", "field": "value", "type": "quantitative"},
          "y": {"field": "construction", "type": "nominal"},
          "color": {"field": "type", "type": "nominal"}
        }
      }
    ]
  }

  if (opts && opts.yrule) {
    const rule = [{}]
    rule[0][title] = opts.yrule
    graph.vconcat[0].layer.push({
      "data": { "values": rule },
      "layer": [{
        "mark": "rule",
        "encoding": {
          "x": {"field": title, "type": "quantitative"},
          "color": {"value": "red"},
          "size": {"value": 3}
        }
      }]
    })
  }
  return vl(graph)
}

add_query = (query, ext) => {
  return query.map(d => Object.assign({}, d, ext))
}

extend_query = (array, ...exts) => {
  let query = array

  const extend_one = (arr, ext) => arr.map(d => ext.map((_, i) => Object.assign({}, d, ext[i])))

  exts.forEach(ext => {
    query = extend_one(query, ext).flat()
  })

  return query
}

multiple_solutions = (solutions, group_by, filter) => {
  return solutions.map(s => {
    const solution = {}

    filter.forEach(d => {
      solution[d] = s[d]
    })
    solution.name = group_by.map(g => `${g}=${s[g]}`).join(', ')

    return solution
  })
}

table_constraints = (solutions, filter, group_by, sort_by) => {
  let results = multiple_solutions(solutions, group_by, filter)
  if (sort_by) {
    results = results.sort((a, b) => +a[sort_by] > +b[sort_by])
  }
  const header = `
  ${sort_by ? `Sorted by: ${sort_by}` : ''}

  ${group_by.length ? `| name ` : ``}| ${filter.join(' | ')} |`
  const divider = `${group_by.length ? `| --- ` : ``}| ${filter.map(f => '--:').join(' | ')} |`
  const rows = results.map(r => {
    return `${group_by.length ? `| ${r.name} ` : ``}| ${filter.map(f => `\`${_f(r[f])}\``).join(' | ')}`
  })
  const table = [header, divider, rows.join('\n')].join('\n')

  return md`${table}`
}

chooser = (data, field, base) => {
  const log_base = base ? Math.log10(base) : false
  const maximum = Math.log10(Math.max(...solved_many.map(d => d[field])))+0.5
  const minimum = Math.log10(Math.min(...solved_many.map(d => d[field])))
  const format = v => `${_f(Math.pow(10, v))} ${vars[field].type || ''}`

  return slider({
    title: field,
    description: vars[field].description,
    min: minimum,
    max: maximum,
    value: log_base || maximum,
    step: 0.01,
    format: format,
  })
}

md`### Utils`

_f = (d) => typeof d == 'number' || !Number.isNaN(+d) ? d3.format('0.3~f')(d) : d

function formToObject (form) {
  // Array.from(form.children).forEach(el => {
  //   el.append(html`<span>hey</span>`)
  // })
  Array.from(form.querySelectorAll('input')).forEach(el => {
    el.parentNode.append(html`<output name=output_${el.name} style="font: 14px Menlo, Consolas, monospace; margin-left: 0.5em;"></output>`)
  })


  form.oninput = () => {
    form.value = Array.from(form.elements)
      .reduce(function(map, _, i) {
        if (form.elements[i].name.substr(0,6) !== 'output') {
          map[form.elements[i].name] = form.elements[i].valueAsNumber
        }
        return map;
      }, {});

    Object.keys(form.value).forEach(k => { form[`output_${k}`].value = form[k].value })
  }

  form.oninput()
  return form
}

function flatten(items) {
  const flat = [];

  items.forEach(item => {
    if (Array.isArray(item)) {
      flat.push(...flatten(item));
    } else {
      flat.push(item);
    }
  });

  return flat;
}

md`### Imports`

import {slider, checkbox, number} from "@jashkenas/inputs"
d3 = require('d3')
vl = require('@observablehq/vega-lite')
import { createJsonDownloadButton } from "@trebor/download-json"

md`### Styles`

html`<style>
.markdown-body table td, .markdown-body table t {
  padding: 4px !important;
}
table {
  font-size: 12px
}
th {
  font-size: 10px;
}
</style>`

graph_constraints = (solutions, x, y, group_by, opts) => {
  const results = multiple_solutions(solutions, group_by, [x, y])
  const graph = {
    "title": `Plotting:  ${x} vs ${y}`,
    "width": 600,
    layer: [{
      "data": {"values": results},
      "mark": {"type": "line"},
      "encoding": {
        "x": {
          "field": x,
          "type": "quantitative",
        },
        "y": {
          "field": y,
          "type": "quantitative",
        },
        "color": {
          "field": "name",
          "type": "nominal",
          "scale": {"scheme": "category10"}
        },
      },
    }]
  }
  if (opts && opts.height) {
    graph.height = opts.height
  }
  if (opts && opts.yrule) {
    const rule = [{}]
    rule[0][y] = opts.yrule

    graph.layer.push({
      "data": { "values": rule },
      "layer": [{
        "mark": "rule",
        "encoding": {
          "y": {"field": y, "type": "quantitative"},
          "color": {"value": "red"},
          "size": {"value": 3}
        }
      }]
    })
  }
  return vl(graph)

}

Plotly = require("https://cdn.plot.ly/plotly-latest.min.js")


plot3d = (rows, x, y, z) =>  {
  var zData = rows.map(d => {
    return [d[x], d[y], d[z]]
  });

  var data = [{
    z: zData,
    type: 'surface'
  }];

  var data2 = [{
    x: rows.map(d => d[x]),
    y: rows.map(d => d[y]),
    z: rows.map(d => d[z]),
    type: 'scatter3d'
  }]

  var layout = {
    title: `${x} vs ${y} vs ${z}`,
    autosize: false,
    width: width * 0.7,
    height: width * 0.7,
    scene: {
      xaxis: {
        title:{
          text: x,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f'
          }
        }
      },
      yaxis: {
        title:{
          text: y,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f'
          }
        }
      },
      zaxis: {
        title:{
          text: z,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f'
          }
        }
      }
    },
    margin: {
      l: 65,
      r: 50,
      b: 65,
      t: 90,
    }
  };

  const div = DOM.element('div');
  Plotly.newPlot(div, data2, layout);
  return div
}

// plotMultiLine(delta_solved, 'chung_delta', ['decoding_time_parallel', 'epost_time_parallel', 'onboard_tib_time_days'])

plotMultiLine = (solutions, x, names) => {

  const traces = names.map(y => {
    return {
      x: solutions.map(d => d[x]),
      y: solutions.map(d => d[y]),
      name: `${y} data`,
      yaxis: y,
      type: 'scatter'
    }
  })

  var layout = {
    title: 'multiple y-axes example',
    // width: 800,
    autosize: false,
    xaxis: {domain: [0.01, 0.20]},
    yaxis: {
      title: 'yaxis title',
      titlefont: {color: '#1f77b4'},
      tickfont: {color: '#1f77b4'}
    },
    yaxis2: {
      title: 'yaxis2 title',
      titlefont: {color: '#ff7f0e'},
      tickfont: {color: '#ff7f0e'},
      anchor: 'free',
      overlaying: 'y',
      side: 'left',
      position: 0.15
    },
    yaxis3: {
      title: 'yaxis4 title',
      titlefont: {color: '#d62728'},
      tickfont: {color: '#d62728'},
      anchor: 'right',
      overlaying: 'y',
      side: 'left'
    },
  };

  const div = DOM.element('div');
  Plotly.newPlot(div, traces, layout);
  return div
}
