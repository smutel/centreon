import { createSelector } from 'reselect';

/**
 * loop on each group/child to get first url
 * @param {Object} item
 * @return {String|undefined} first url found
 */
function findFirstUrl(item) {
  if (item.groups) {
    const groupWithUrl = item.groups.find(findFirstUrl);

    return groupWithUrl && groupWithUrl.children ? getFirstUrlInChildren(groupWithUrl) : undefined;
  }

  return item.children ? getFirstUrlInChildren(item) : undefined;
}

/**
 * find first URL in children prop
 * @param {Object} item
 * @return {String|undefined} first url found
 */
function getFirstUrlInChildren(item) {
  if (!item.children) {
    return undefined;
  }

  const childWithUrl = item.children.find((child) => child.url);

  if (childWithUrl) {
    return getUrl(childWithUrl);
  }

  if (item.children) {
    const childWithUrl = item.children.find(findFirstUrl);
    return childWithUrl ? findFirstUrl(childWithUrl) : undefined;
  }
}

/**
 * get URL from legacy or react pages
 * @param {Object} item
 * @return {String} build URL
 */
function getUrl(item) {
  return item.is_react ? item.url : `/main.php?p=${item.page}${item.options !== null ? item.options : ''}`;
}

/**
 * get breadcrumb step information from an entry
 * @param Object item
 * @return {Object|null} breadcrumb step information
 */
function getBreadcrumbStep(item) {
    const availableUrl = item.url ? getUrl(item) : findFirstUrl(item);
    return availableUrl
      ? {
        label: item.label,
        link: availableUrl,
      }
      : null;
}

const getNavigationItems = (state) => state.navigation.items;

export const breadcrumbsSelector = createSelector(
  getNavigationItems,
  (navItems) => {
    let breadcrumbs = {};

    // build level 1 breadcrumbs
    navItems.map((itemLvl1) => {
      const stepLvl1 = getBreadcrumbStep(itemLvl1);
      if (stepLvl1 === null) {
        return;
      }
      breadcrumbs[stepLvl1.link] = [
        {
          label: stepLvl1.label,
          link: stepLvl1.link,
        }
      ];

      // build level 2 breadcrumbs
      if (itemLvl1.children) {
        itemLvl1.children.map((itemLvl2) => {
          const stepLvl2 = getBreadcrumbStep(itemLvl2);
          if (stepLvl2 === null) {
            return;
          }
          breadcrumbs[stepLvl2.link] = [
            {
              label: stepLvl1.label,
              link: stepLvl1.link,
            },
            {
              label: stepLvl2.label,
              link: stepLvl2.link,
            },
          ];

          // build level 3 breadcrumbs
          if (itemLvl2.groups) {
            itemLvl2.groups.map((groupLvl3) => {
              if (groupLvl3.children) {
                groupLvl3.children.map((itemLvl3) => {
                  const stepLvl3 = getBreadcrumbStep(itemLvl3);
                  if (stepLvl3 === null) {
                    return;
                  }
                  breadcrumbs[stepLvl3.link] = [
                    {
                      label: stepLvl1.label,
                      link: stepLvl1.link,
                    },
                    {
                      label: stepLvl2.label,
                      link: stepLvl2.link,
                    },
                    {
                      label: stepLvl3.label,
                      link: stepLvl3.link,
                    },
                  ];
                });
              }
            });
          }
        });
      }
    });

    return breadcrumbs;
  },
);