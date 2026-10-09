package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		collectionId, _ := app.FindCollectionByNameOrId("activity_categories")
		if collectionId != nil {
			return nil
		}

		activityCategories := core.NewBaseCollection("activity_categories")

		activityCategories.Fields.Add(
			&core.TextField{
				Name:     "key",
				Required: true,
			},
			&core.TextField{
				Name:     "name",
				Required: true,
			},
			&core.TextField{
				Name:     "emoji",
				Required: true,
			},
			&core.SelectField{
				Name:      "color",
				Required:  true,
				Values:    []string{"red", "pink", "grape", "violet", "indigo", "blue", "cyan", "teal", "green", "lime", "yellow", "orange"},
				MaxSelect: 1,
			},
			&core.NumberField{
				Name:     "order",
				Required: true,
				OnlyInt:  true,
			},
			&core.AutodateField{
				Name:     "created",
				OnCreate: true,
				OnUpdate: false,
			},
			&core.AutodateField{
				Name:     "updated",
				OnCreate: true,
				OnUpdate: true,
			},
		)

		activityCategories.AddIndex("ac_key_uidx", true, "key", "")

		activityCategories.ListRule = types.Pointer("")
		activityCategories.ViewRule = types.Pointer("")

		return app.Save(activityCategories)
	}, func(app core.App) error {
		activityCategories, err := app.FindCollectionByNameOrId("activity_categories")
		if err != nil {
			return err
		}
		return app.Delete(activityCategories)
	})
}
