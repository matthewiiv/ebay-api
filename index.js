const request = require('superagent');
const fs = require('fs-extra');

let rawdata = fs.readFileSync('categories.json');
let categories = JSON.parse(rawdata);

const categoriesJSON = categories.GetCategoriesResponse.CategoryArray.Category.map(
  c => {
    return {
      id: c.CategoryID,
      label: c.CategoryName,
      description: c.CategoryName,
      parentId: c.CategoryParentID
    };
  }
);

const searchCategories = categories.GetCategoriesResponse.CategoryArray.Category.slice(
  0,
  5
);

const itemsRoot = '';

searchCategories.forEach(c => callHistogram(c.CategoryID, c.CategoryName, c));

function callHistogram(id, name, category) {
  request.get(itemsRoot + id).end((err, res) => {
    const aspectHistogram = JSON.parse(res.text).getHistogramsResponse[0][
      'aspectHistogramContainer'
    ];
    if (aspectHistogram) {
      const attributeTypes = aspectHistogram[0].aspect.map(a => {
        return {
          id: toCamelCase(`${name}${a['@name']}`),
          schema: {
            title: a['@name'],
            description: a['@name'],
            category: 'Identification',
            type: 'string',
            autoCompleteValues: [
              {
                type: 'url',
                value: 'https://mysuggestionservice.bulbthings.com/'
              },
              {
                type: 'array',
                value: a.valueHistogram.slice(0, 10).map(v => v['@valueName'])
              }
            ]
          },
          timeSeriesOptions: {
            interval: 'P1M'
          }
        };
      });
      const attributeTypesJSON = aspectHistogram[0].aspect.map((a, i) => {
        return {
          name: toCamelCase(`${name}${a['@name']}`),
          body: { meta: { order: i } }
        };
      });
      const categoryJSON = {
        id: category.CategoryID,
        label: category.CategoryName,
        description: category.CategoryName,
        parentId: category.CategoryParentID
      };

      attributeTypes.forEach(at => {
        let data = JSON.stringify(at);
        writeFile(`./files/attribute-types/${at.id}/${at.id}.json`, data);
      });
      writeFile(
        `./files/entity-types/${toCamelCase(name)}/attributesType.json`,
        JSON.stringify(attributeTypesJSON)
      );
      writeFile(
        `./files/entity-types/${toCamelCase(name)}/${toCamelCase(name)}.json`,
        JSON.stringify(categoryJSON)
      );
    }
  });
}

function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index == 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    .replace(/&/g, '');
}

function writeFile(path, contents) {
  fs.outputFile(path, contents, function(err) {});
}
