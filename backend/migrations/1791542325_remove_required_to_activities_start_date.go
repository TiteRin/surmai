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

		startDate := activities.Fields.GetByName("startDate").(*core.DateField)
		startDate.Required = false

		return app.Save(activities)
	}, func(app core.App) error {

		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		startDate := activities.Fields.GetByName("startDate").(*core.DateField)
		startDate.Required = true

		return app.Save(activities)
	})
}
