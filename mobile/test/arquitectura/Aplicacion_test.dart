import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:guajiranet_mobile/Aplicacion.dart';

void main() {
  testWidgets(
    'La aplicacion inicia correctamente',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: Aplicacion(),
        ),
      );

      expect(find.text('GuajiraNet Mobile'), findsOneWidget);
    },
  );
}
