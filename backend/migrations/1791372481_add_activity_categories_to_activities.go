package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		activityCategoriesCollection, _ := app.FindCollectionByNameOrId("activity_categories")

		activities.Fields.Add(
			&core.RelationField{
				Name:          "category",
				CollectionId:  activityCategoriesCollection.Id,
				MaxSelect:     1,
				Required:      false,
				CascadeDelete: false,
			},
		)

		return app.Save(activities)

	}, func(app core.App) error {

		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		activities.Fields.RemoveByName("categories")

		return app.Save(activities)
	})
}
